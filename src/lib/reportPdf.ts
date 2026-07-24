import { jsPDF } from "jspdf";
import { Report, ReportScores } from "@/services/report.service";

interface ReportPdfInput {
  report: Report;
  examTitle: string;
  examDescription?: string;
  studentName: string;
  totalTimeLabel: string;
  exerciseCount: number;
}

const DIMENSION_LABELS: Record<string, string> = {
  engagement: "Engagement",
  confidence: "Confidence",
  persistence: "Persistence",
  emotionalState: "Emotional State",
};

// RGB colors (jsPDF works in RGB, so we avoid Tailwind's oklch values).
const COLORS = {
  blue: [59, 130, 246] as const,
  purple: [139, 92, 246] as const,
  green: [16, 185, 129] as const,
  amber: [245, 158, 11] as const,
  slate: [71, 85, 105] as const,
  gray: [107, 114, 128] as const,
  dark: [17, 24, 39] as const,
  light: [229, 231, 235] as const,
};

const DIMENSION_COLORS: Record<string, readonly [number, number, number]> = {
  engagement: COLORS.blue,
  confidence: COLORS.purple,
  persistence: COLORS.green,
  emotionalState: COLORS.amber,
};

/**
 * Build and trigger download of a clean, text-based PDF from the report data.
 * Uses jsPDF directly (rather than a DOM screenshot) so the output stays crisp
 * and is unaffected by the app's CSS color space.
 */
export function downloadReportPdf(input: ReportPdfInput): void {
  const { report, examTitle, examDescription, studentName, totalTimeLabel, exerciseCount } = input;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const scores: ReportScores = report.scores ?? {
    engagement: 0,
    confidence: 0,
    persistence: 0,
    emotionalState: 0,
  };

  // --- Header banner --------------------------------------------------------
  const headerHeight = 92;
  doc.setFillColor(59, 130, 246);
  doc.rect(margin, y, contentWidth, headerHeight, "F");

  doc.setTextColor(219, 234, 254);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("MOTISCAN · AI MOTIVATION REPORT", margin + 16, y + 22);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(examTitle, contentWidth - 32);
  doc.text(titleLines[0], margin + 16, y + 44);

  if (examDescription) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(219, 234, 254);
    const descLines = doc.splitTextToSize(examDescription, contentWidth - 32);
    doc.text(descLines.slice(0, 2), margin + 16, y + 62);
  }
  y += headerHeight + 18;

  // --- Meta row -------------------------------------------------------------
  const meta: [string, string][] = [
    ["Student", studentName],
    ["Date", new Date(report.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })],
    ["Total Time", totalTimeLabel],
    ["Exercises", String(exerciseCount)],
  ];
  const cellWidth = contentWidth / meta.length;
  meta.forEach(([label, value], i) => {
    const x = margin + i * cellWidth;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    doc.text(label.toUpperCase(), x, y);
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.dark);
    const valLines = doc.splitTextToSize(value, cellWidth - 8);
    doc.text(valLines[0], x, y + 15);
  });
  y += 34;

  doc.setDrawColor(...COLORS.light);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  // --- Motivation scores ----------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.dark);
  doc.text("Motivation Scores", margin, y);
  y += 18;

  const dims: (keyof ReportScores)[] = ["engagement", "confidence", "persistence", "emotionalState"];
  const barX = margin + 130;
  const barWidth = contentWidth - 130 - 40;
  dims.forEach((dim) => {
    ensureSpace(26);
    const value = Math.max(0, Math.min(100, scores[dim] ?? 0));
    const color = DIMENSION_COLORS[dim] ?? COLORS.slate;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.slate);
    doc.text(DIMENSION_LABELS[dim], margin, y + 8);

    // Track
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(barX, y, barWidth, 10, 5, 5, "F");
    // Fill
    if (value > 0) {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(barX, y, Math.max((value / 100) * barWidth, 6), 10, 5, 5, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.dark);
    doc.text(`${value}/100`, barX + barWidth + 8, y + 9);
    y += 22;
  });
  y += 12;

  // --- AI summary -----------------------------------------------------------
  if (report.summary) {
    ensureSpace(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.dark);
    doc.text("AI Analysis Summary", margin, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.slate);
    const summaryLines = doc.splitTextToSize(report.summary, contentWidth);
    summaryLines.forEach((line: string) => {
      ensureSpace(14);
      doc.text(line, margin, y);
      y += 14;
    });
    y += 14;
  }

  // --- Score breakdown ------------------------------------------------------
  if (report.attributions.length > 0) {
    ensureSpace(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.dark);
    doc.text("Score Breakdown", margin, y);
    y += 18;

    report.attributions.forEach((attr) => {
      const color = DIMENSION_COLORS[attr.dimension] ?? COLORS.slate;
      const label = DIMENSION_LABELS[attr.dimension] ?? attr.dimension;
      const heading = attr.exerciseTitle ? `${label} · ${attr.exerciseTitle}` : label;
      const reasonLines = doc.splitTextToSize(attr.reason, contentWidth - 16);

      ensureSpace(20 + reasonLines.length * 13);

      const blockTop = y - 8;
      const blockHeight = 16 + reasonLines.length * 13;
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(margin, blockTop, 3, blockHeight, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(heading.toUpperCase(), margin + 12, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.slate);
      reasonLines.forEach((line: string) => {
        doc.text(line, margin + 12, y);
        y += 13;
      });
      y += 10;
    });
    y += 4;
  }

  // --- Recommendations ------------------------------------------------------
  if (report.recommendations.length > 0) {
    ensureSpace(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.dark);
    doc.text("Recommendations", margin, y);
    y += 18;

    report.recommendations.forEach((rec, i) => {
      const recLines = doc.splitTextToSize(rec, contentWidth - 22);
      ensureSpace(recLines.length * 13 + 8);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.blue);
      doc.text(`${i + 1}.`, margin, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.slate);
      recLines.forEach((line: string, li: number) => {
        doc.text(line, margin + 18, y + li * 13);
      });
      y += recLines.length * 13 + 8;
    });
  }

  const safeName = `${studentName}-${examTitle}`
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  doc.save(`motiscan-report-${safeName || "export"}.pdf`);
}

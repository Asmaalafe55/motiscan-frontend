"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { examService } from "@/services/exam.service";
import { studentService } from "@/services/student.service";
import { trackingService } from "@/services/tracking.service";
import { aiReportService, AIReport } from "@/services/aiReportService";
import { Exam, User } from "@/types";
import { ArrowLeft, Printer, Brain } from "lucide-react";
import { format } from "date-fns";

// ---------------------------------------------------------------------------
// Circular progress SVG
// ---------------------------------------------------------------------------
function CircularScore({
  score,
  color,
  label,
  sublabel,
}: {
  score: number;
  color: string;
  label: string;
  sublabel?: string;
}) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2 print:gap-1">
      <svg width="110" height="110" viewBox="0 0 110 110" className="drop-shadow-sm">
        {/* Track */}
        <circle cx="55" cy="55" r={r} fill="none" stroke="#e5e7eb" strokeWidth="11" />
        {/* Progress */}
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 55 55)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        {/* Score text */}
        <text
          x="55"
          y="51"
          textAnchor="middle"
          fontSize="20"
          fontWeight="700"
          fill="#111827"
          fontFamily="inherit"
        >
          {score}
        </text>
        <text
          x="55"
          y="67"
          textAnchor="middle"
          fontSize="10"
          fill="#6b7280"
          fontFamily="inherit"
        >
          / 100
        </text>
      </svg>
      <p className="text-sm font-semibold text-gray-800 text-center leading-tight">{label}</p>
      {sublabel && <p className="text-xs text-gray-500 text-center">{sublabel}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Type label helper
// ---------------------------------------------------------------------------
function formatType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtSeconds(s: number) {
  if (s === 0) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AIReportPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  const studentId = params.studentId as string;

  const [report, setReport] = useState<AIReport | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [student, setStudent] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generate = async () => {
      try {
        const [examData, studentData, allAttempts, submissions] = await Promise.all([
          examService.getExamById(examId),
          studentService.getStudentById(studentId),
          trackingService.getExerciseAttemptsByExam(examId),
          examService.getSubmissionsForExam(examId),
        ]);

        if (!examData || !studentData) {
          setError("Exam or student not found.");
          return;
        }

        setExam(examData);
        setStudent(studentData);

        const studentAttempts = allAttempts.filter((a) => a.studentId === studentId);
        const submission = submissions.find((s) => s.studentId === studentId);
        const totalTimeSpent = submission?.timeSpent ?? 0;

        const generated = await aiReportService.generateAIReport({
          studentId,
          studentName: studentData.name,
          examId,
          examTitle: examData.title,
          attempts: studentAttempts,
          totalTimeSpent,
        });

        setReport(generated);
      } catch (err) {
        console.error(err);
        setError("Failed to generate report. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    generate();
  }, [examId, studentId]);

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Layout role="teacher">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            <Brain className="absolute inset-0 m-auto h-7 w-7 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">AI is analyzing responses…</p>
            <p className="text-sm text-muted-foreground mt-1">
              Calculating engagement, confidence, and persistence scores
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error || !report || !exam || !student) {
    return (
      <Layout role="teacher">
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <p className="text-muted-foreground">{error ?? "Report unavailable."}</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  const emotionalColors: Record<string, string> = {
    Positive: "#10b981",
    Neutral: "#f59e0b",
    "Needs Attention": "#ef4444",
  };
  const emotionalColor = emotionalColors[report.emotionalStateLabel] ?? "#6b7280";

  const totalMin = Math.floor(report.totalTimeSpent / 60);
  const totalSec = report.totalTimeSpent % 60;
  const timeLabel =
    report.totalTimeSpent > 0
      ? totalMin > 0
        ? `${totalMin}m ${totalSec}s`
        : `${totalSec}s`
      : "N/A";

  return (
    <>
      {/*
        Print styles — hides the sidebar, header, and action bar so only
        the report content prints. No external library needed.
      */}
      <style>{`
        @media print {
          aside,
          header,
          #report-actions { display: none !important; }
          /* Remove the sidebar margin from the main content wrapper */
          .flex-1[style] { margin-inline-start: 0 !important; }
          main { padding: 16px !important; }
          body { background: white !important; }
          /* Avoid page breaks inside cards */
          .print-card { break-inside: avoid; }
        }
      `}</style>

      <Layout role="teacher">
        {/* ── Action bar (hidden on print) ────────────────────────────── */}
        <div
          id="report-actions"
          className="flex items-center justify-between mb-6 print:hidden"
        >
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print / Export PDF
          </Button>
        </div>

        {/* ── Report body ─────────────────────────────────────────────── */}
        <div id="report-body" className="max-w-4xl mx-auto space-y-6 print:space-y-4">

          {/* ── Header card ── */}
          <div className="print-card rounded-2xl border bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white shadow-lg print:shadow-none">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-1">
                  MotiScan · AI Motivation Report
                </p>
                <h1 className="text-2xl font-bold leading-tight">{exam.title}</h1>
                <p className="mt-1 text-blue-100 text-sm">{exam.description}</p>
              </div>
              {/* Logo mark */}
              <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
            </div>

            {/* Meta row */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Student", value: student.name },
                { label: "Date", value: format(new Date(report.generatedAt), "MMM d, yyyy") },
                { label: "Total Time", value: timeLabel },
                { label: "Exercises", value: `${exam.questions.length}` },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-white/10 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">
                    {item.label}
                  </p>
                  <p className="text-sm font-bold mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Score cards ── */}
          <div className="print-card rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 mb-5">Motivation Scores</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
              <CircularScore
                score={report.scores.engagement}
                color="#3b82f6"
                label="Engagement"
                sublabel="Activity & responsiveness"
              />
              <CircularScore
                score={report.scores.confidence}
                color="#8b5cf6"
                label="Confidence"
                sublabel="Answer certainty"
              />
              <CircularScore
                score={report.scores.persistence}
                color="#10b981"
                label="Persistence"
                sublabel="Effort & duration"
              />
              <CircularScore
                score={report.scores.emotionalState}
                color={emotionalColor}
                label="Emotional State"
                sublabel={report.emotionalStateLabel}
              />
            </div>
          </div>

          {/* ── AI Summary ── */}
          <div className="print-card rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-blue-600" />
              <h2 className="text-base font-bold text-gray-800">AI Analysis Summary</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{report.summary}</p>
          </div>

          {/* ── Exercise breakdown table ── */}
          {report.exerciseBreakdown.length > 0 && (
            <div className="print-card rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-base font-bold text-gray-800">Exercise Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time Spent</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Answer Length</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Edits</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.exerciseBreakdown.map((ex) => (
                      <tr key={ex.exerciseId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-700">{ex.order}</td>
                        <td className="px-4 py-3 text-gray-600">{formatType(ex.type)}</td>
                        <td className="px-4 py-3 text-gray-600">{fmtSeconds(ex.durationSeconds)}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {ex.answerLength > 0 ? `${ex.answerLength} chars` : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {ex.editsCount !== undefined ? ex.editsCount : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              ex.skipped
                                ? "bg-red-100 text-red-700"
                                : ex.revisited
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {ex.skipped ? "Skipped" : ex.revisited ? "Revisited" : "Completed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Recommendations ── */}
          <div className="print-card rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 mb-4">Recommendations</h2>
            <ol className="space-y-3">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{rec}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* ── Footer (visible on print) ── */}
          <div className="hidden print:block text-center text-xs text-gray-400 pt-4 border-t">
            Generated by MotiScan AI · {format(new Date(report.generatedAt), "PPpp")}
          </div>

        </div>
      </Layout>
    </>
  );
}

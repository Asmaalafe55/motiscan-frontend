"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { examService } from "@/services/exam.service";
import { studentService } from "@/services/student.service";
import { reportService, Report, ReportScores } from "@/services/report.service";
import { downloadReportPdf } from "@/lib/reportPdf";
import { Exam, User } from "@/types";
import { ArrowLeft, Download, Brain } from "lucide-react";
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
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circ - (clamped / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2 print:gap-1">
      <svg width="110" height="110" viewBox="0 0 110 110" className="drop-shadow-sm">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#e5e7eb" strokeWidth="11" />
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
        <text x="55" y="51" textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827" fontFamily="inherit">
          {clamped}
        </text>
        <text x="55" y="67" textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="inherit">
          / 100
        </text>
      </svg>
      <p className="text-sm font-semibold text-gray-800 text-center leading-tight">{label}</p>
      {sublabel && <p className="text-xs text-gray-500 text-center">{sublabel}</p>}
    </div>
  );
}

const DIMENSION_LABELS: Record<string, string> = {
  engagement: "Engagement",
  confidence: "Confidence",
  persistence: "Persistence",
  emotionalState: "Emotional State",
};

const DIMENSION_COLORS: Record<string, string> = {
  engagement: "#3b82f6",
  confidence: "#8b5cf6",
  persistence: "#10b981",
  emotionalState: "#f59e0b",
};

function emotionalLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "Positive", color: "#10b981" };
  if (score >= 40) return { label: "Neutral", color: "#f59e0b" };
  return { label: "Needs Attention", color: "#ef4444" };
}

function fmtTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "N/A";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AIReportPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  const examId = params.examId as string;

  const [report, setReport] = useState<Report | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [student, setStudent] = useState<User | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [examData, studentData, submissions] = await Promise.all([
          examService.getExamById(examId),
          studentService.getStudentById(studentId),
          examService.getSubmissionsForExam(examId),
        ]);

        if (!examData || !studentData) {
          setError("Exam or student not found.");
          return;
        }
        setExam(examData);
        setStudent(studentData);

        const submission = submissions.find((s) => s.studentId === studentId);
        if (!submission) {
          setError("This student has not submitted this exam yet.");
          return;
        }
        setTimeSpent(submission.timeSpent ?? 0);

        // Use the stored report if present, otherwise generate one now.
        let data = await reportService.getReportBySubmission(submission.id);
        if (!data) {
          data = await reportService.generateReport(submission.id);
        }
        setReport(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load the report. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [examId, studentId]);

  const handleDownloadPdf = () => {
    if (!report || !exam || !student) return;
    downloadReportPdf({
      report,
      examTitle: exam.title,
      examDescription: exam.description,
      studentName: student.name,
      totalTimeLabel: fmtTime(timeSpent),
      exerciseCount: exam.questions.length,
    });
  };

  if (isLoading) {
    return (
      <Layout role="teacher">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            <Brain className="absolute inset-0 m-auto h-7 w-7 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">Preparing motivation report…</p>
            <p className="text-sm text-muted-foreground mt-1">
              Analyzing engagement, confidence, and persistence
            </p>
          </div>
        </div>
      </Layout>
    );
  }

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

  const scores: ReportScores = report.scores ?? {
    engagement: 0,
    confidence: 0,
    persistence: 0,
    emotionalState: 0,
  };
  const emotional = emotionalLabel(scores.emotionalState);

  return (
    <Layout role="teacher">
      <div id="report-actions" className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadPdf} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header card */}
        <div className="rounded-2xl border bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-1">
                MotiScan · AI Motivation Report
              </p>
              <h1 className="text-2xl font-bold leading-tight">{exam.title}</h1>
              {exam.description && <p className="mt-1 text-blue-100 text-sm">{exam.description}</p>}
            </div>
            <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Student", value: student.name },
              { label: "Date", value: format(new Date(report.generatedAt), "MMM d, yyyy") },
              { label: "Total Time", value: fmtTime(timeSpent) },
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

        {/* Score cards */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-5">Motivation Scores</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
            <CircularScore score={scores.engagement} color="#3b82f6" label="Engagement" sublabel="Activity & responsiveness" />
            <CircularScore score={scores.confidence} color="#8b5cf6" label="Confidence" sublabel="Answer certainty" />
            <CircularScore score={scores.persistence} color="#10b981" label="Persistence" sublabel="Effort & duration" />
            <CircularScore score={scores.emotionalState} color={emotional.color} label="Emotional State" sublabel={emotional.label} />
          </div>
        </div>

        {/* AI Summary */}
        {report.summary && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-blue-600" />
              <h2 className="text-base font-bold text-gray-800">AI Analysis Summary</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{report.summary}</p>
          </div>
        )}

        {/* Score attributions */}
        {report.attributions.length > 0 && (
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-base font-bold text-gray-800">
                Score Breakdown — Where Each Score Came From
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Which exercises contributed to each motivation dimension and why
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {report.attributions.map((attr, i) => {
                const color = DIMENSION_COLORS[attr.dimension] ?? "#6b7280";
                const label = DIMENSION_LABELS[attr.dimension] ?? attr.dimension;
                return (
                  <div key={i} className="px-6 py-4 flex gap-3" style={{ borderLeft: `4px solid ${color}` }}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-xs font-bold uppercase tracking-wide text-gray-700">{label}</span>
                        {attr.exerciseTitle && (
                          <span className="text-xs text-gray-400">· {attr.exerciseTitle}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-snug">{attr.reason}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
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
        )}
      </div>
    </Layout>
  );
}

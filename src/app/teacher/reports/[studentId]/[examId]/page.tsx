"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { examService } from "@/services/exam.service";
import { studentService } from "@/services/student.service";
import { trackingService } from "@/services/tracking.service";
import { aiReportService, AIReport, ScoreAttribution, AttributionEntry } from "@/services/aiReportService";
import type { MeasureDimension } from "@/types";
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
          {score}
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

function formatType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtSeconds(s: number) {
  if (s === 0) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

const MEASURE_COLORS: Record<MeasureDimension, string> = {
  attention:             "bg-blue-50 text-blue-700 border-blue-200",
  analytical_engagement: "bg-blue-50 text-blue-700 border-blue-200",
  cognitive_persistence: "bg-cyan-50 text-cyan-700 border-cyan-200",
  thoroughness:          "bg-teal-50 text-teal-700 border-teal-200",
  confidence:            "bg-purple-50 text-purple-700 border-purple-200",
  rule_compliance:       "bg-violet-50 text-violet-700 border-violet-200",
  self_awareness:        "bg-purple-50 text-purple-700 border-purple-200",
  honesty_indicators:    "bg-indigo-50 text-indigo-700 border-indigo-200",
  effort:                "bg-green-50 text-green-700 border-green-200",
  emotional_state:       "bg-amber-50 text-amber-700 border-amber-200",
  self_expression_depth: "bg-orange-50 text-orange-700 border-orange-200",
  creativity:            "bg-pink-50 text-pink-700 border-pink-200",
  risk_taking:           "bg-rose-50 text-rose-700 border-rose-200",
};

function MeasureBadge({ m }: { m: MeasureDimension }) {
  const colors = MEASURE_COLORS[m] ?? "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none ${colors}`}>
      {m.replace(/_/g, "\u00a0")}
    </span>
  );
}

function IndicatorIcon({ indicator }: { indicator: AttributionEntry["indicator"] }) {
  if (indicator === "positive") return <span title="Positive signal">✅</span>;
  if (indicator === "warning")  return <span title="Moderate / mixed signal">⚠️</span>;
  return <span title="Low / missing signal">🔴</span>;
}

function ScoreAttributionCard({ attr }: { attr: ScoreAttribution }) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderLeft: `4px solid ${attr.color}` }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: attr.color }} />
          <span className="text-sm font-bold uppercase tracking-wide text-gray-800">
            {attr.scoreName}
          </span>
        </div>
        <span className="text-lg font-extrabold tabular-nums" style={{ color: attr.color }}>
          {attr.score}
          <span className="text-xs font-normal text-gray-400">/100</span>
        </span>
      </div>
      {attr.entries.length === 0 ? (
        <p className="px-5 py-3 text-xs text-gray-400 italic">No specific exercises target this dimension.</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {attr.entries.map((entry, i) => (
            <div key={i} className="px-5 py-3 flex gap-3">
              <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
                <span className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-600">
                  {entry.exerciseOrder}
                </span>
                <IndicatorIcon indicator={entry.indicator} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Exercise {entry.exerciseOrder} ·{" "}
                  <span className="font-normal text-gray-500">{formatType(entry.exerciseType)}</span>
                </p>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  <span className="text-[10px] text-gray-400 self-center mr-0.5">Measures:</span>
                  {entry.measures.map((m) => (
                    <MeasureBadge key={m} m={m} />
                  ))}
                </div>
                <p className="text-xs text-gray-500 leading-snug">{entry.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AIReportPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  const examId = params.examId as string;

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
      <style>{`
        @media print {
          aside,
          header,
          #report-actions { display: none !important; }
          .flex-1[style] { margin-inline-start: 0 !important; }
          main { padding: 16px !important; }
          body { background: white !important; }
          .print-card { break-inside: avoid; }
        }
      `}</style>

      <Layout role="teacher">
        <div id="report-actions" className="flex items-center justify-between mb-6 print:hidden">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Print / Export PDF
          </Button>
        </div>

        <div id="report-body" className="max-w-4xl mx-auto space-y-6 print:space-y-4">

          {/* Header card */}
          <div className="print-card rounded-2xl border bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white shadow-lg print:shadow-none">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-1">
                  MotiScan · AI Motivation Report
                </p>
                <h1 className="text-2xl font-bold leading-tight">{exam.title}</h1>
                <p className="mt-1 text-blue-100 text-sm">{exam.description}</p>
              </div>
              <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
            </div>
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

          {/* Score cards */}
          <div className="print-card rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 mb-5">Motivation Scores</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
              <CircularScore score={report.scores.engagement} color="#3b82f6" label="Engagement" sublabel="Activity & responsiveness" />
              <CircularScore score={report.scores.confidence} color="#8b5cf6" label="Confidence" sublabel="Answer certainty" />
              <CircularScore score={report.scores.persistence} color="#10b981" label="Persistence" sublabel="Effort & duration" />
              <CircularScore score={report.scores.emotionalState} color={emotionalColor} label="Emotional State" sublabel={report.emotionalStateLabel} />
            </div>
          </div>

          {/* Score Breakdown */}
          {report.scoreAttributions.length > 0 && (
            <div className="print-card rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-base font-bold text-gray-800">
                  Score Breakdown — Where Each Score Came From
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Which exercises contributed to each motivation dimension and why
                </p>
              </div>
              <div className="p-4 grid gap-4 sm:grid-cols-2">
                {report.scoreAttributions.map((attr) => (
                  <ScoreAttributionCard key={attr.scoreKey} attr={attr} />
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          <div className="print-card rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-blue-600" />
              <h2 className="text-base font-bold text-gray-800">AI Analysis Summary</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{report.summary}</p>
          </div>

          {/* Exercise breakdown table */}
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
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Measures</th>
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
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatType(ex.type)}</td>
                        <td className="px-4 py-3">
                          {ex.measures.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {ex.measures.map((m) => (
                                <MeasureBadge key={m} m={m as MeasureDimension} />
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtSeconds(ex.durationSeconds)}</td>
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

          {/* Recommendations */}
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

          {/* Footer (print only) */}
          <div className="hidden print:block text-center text-xs text-gray-400 pt-4 border-t">
            Generated by MotiScan AI · {format(new Date(report.generatedAt), "PPpp")}
          </div>

        </div>
      </Layout>
    </>
  );
}

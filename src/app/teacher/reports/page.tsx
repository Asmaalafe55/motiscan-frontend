"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { examService } from "@/services/exam.service";
import { studentService } from "@/services/student.service";
import { reportService } from "@/services/report.service";
import { pushActivity } from "@/lib/notifications";
import { Exam, ExamSubmission, User } from "@/types";
import { StudentAnswerReview } from "@/components/StudentAnswerReview";
import {
  BarChart3,
  Brain,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  ListChecks,
  Loader2,
  X,
} from "lucide-react";
import { format } from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StudentWithSubmissions {
  student: User;
  submissions: (ExamSubmission & { exam: Exam })[];
}

type SubmissionWithExam = ExamSubmission & { exam: Exam };

// ---------------------------------------------------------------------------
// Read-only answers modal
// ---------------------------------------------------------------------------
function ViewAnswersModal({
  submission,
  studentName,
  onClose,
}: {
  submission: SubmissionWithExam;
  studentName: string;
  onClose: () => void;
}) {
  const { exam, answers } = submission;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ListChecks className="h-5 w-5 text-white flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white truncate">
                {exam.title}
              </h2>
              <p className="text-xs text-blue-100 truncate">{studentName}&apos;s answers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Meta info */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>
                Submitted {format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>Time spent: {Math.floor((submission.timeSpent ?? 0) / 60)} min</span>
            </div>
          </div>

          {/* Answers */}
          {exam.questions.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700">Student Answers</p>
              {exam.questions.map((question, idx) => {
                const answer =
                  answers.find((a) => a.questionId === question.id) ??
                  // Fallback: some payloads key answers by exercise/library id
                  answers.find((a) => (a as { exerciseId?: string }).exerciseId === question.id);
                return (
                  <StudentAnswerReview
                    key={question.id}
                    question={question}
                    answer={answer}
                    exerciseIndex={idx}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No exercises found for this exam.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex-shrink-0">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: initials
// ---------------------------------------------------------------------------
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function TeacherReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<StudentWithSubmissions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Track which student cards are expanded
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Track which (studentId:examId) pairs are generating a report
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  // Submission whose answers are shown in the modal (with owning student name)
  const [viewingAnswers, setViewingAnswers] = useState<{
    submission: SubmissionWithExam;
    studentName: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [students, submissions] = await Promise.all([
          studentService.getAllStudents(),
          examService.getAllSubmissions(),
        ]);

        const studentById = new Map(students.map((s) => [s.id, s]));

        // Fetch each referenced exam once.
        const examCache = new Map<string, Exam | null>();
        const getExam = async (examId: string): Promise<Exam | null> => {
          if (!examCache.has(examId)) {
            examCache.set(examId, await examService.getExamById(examId));
          }
          return examCache.get(examId) ?? null;
        };

        // Group submissions by student, attaching the exam to each.
        const byStudent = new Map<string, (ExamSubmission & { exam: Exam })[]>();
        for (const sub of submissions) {
          const exam = await getExam(sub.examId);
          if (!exam) continue;
          const list = byStudent.get(sub.studentId) ?? [];
          list.push({ ...sub, exam });
          byStudent.set(sub.studentId, list);
        }

        const rows: StudentWithSubmissions[] = [];
        for (const [studentId, subs] of byStudent) {
          const student = studentById.get(studentId);
          if (student) rows.push({ student, submissions: subs });
        }

        setData(rows);
        setExpanded(new Set(rows.map((r) => r.student.id)));
      } catch (err) {
        console.error("Error loading reports:", err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const toggleExpand = (studentId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleGenerateReport = async (
    submissionId: string,
    studentId: string,
    examId: string
  ) => {
    const key = `${studentId}:${examId}`;
    setGenerating((prev) => new Set(prev).add(key));
    try {
      await reportService.generateReport(submissionId);

      const row = data.find((r) => r.student.id === studentId);
      const exam = row?.submissions.find((s) => s.examId === examId)?.exam;
      pushActivity({
        type: "report",
        studentId,
        studentName: row?.student.name ?? "A student",
        examId,
        examTitle: exam?.title,
      });

      router.push(`/teacher/reports/${studentId}/${examId}`);
    } catch (err) {
      console.error("Failed to generate report:", err);
      setGenerating((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleViewReport = (studentId: string, examId: string) => {
    router.push(`/teacher/reports/${studentId}/${examId}`);
  };

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <Layout role="teacher">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading reports…</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="teacher">
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold">AI Motivation Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate and view AI-powered motivation reports for each student&apos;s submitted exams
          </p>
        </div>

        {data.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">No submissions yet</p>
              <p className="text-sm text-muted-foreground">
                Reports will appear here once students submit exams
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.map(({ student, submissions }) => {
              const isExpanded = expanded.has(student.id);
              return (
                <Card key={student.id} className="overflow-hidden">
                  {/* Student header — click to expand/collapse */}
                  <button
                    className="w-full text-left"
                    onClick={() => toggleExpand(student.id)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                            {getInitials(student.name)}
                          </div>
                          <div>
                            <p className="text-base font-semibold">{student.name}</p>
                            <p className="text-xs text-muted-foreground font-normal">
                              {student.email} · {submissions.length} submitted exam{submissions.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-normal text-muted-foreground hidden sm:block">
                            {isExpanded ? "Hide" : "Show"} exams
                          </span>
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </CardTitle>
                    </CardHeader>
                  </button>

                  {/* Exam list (collapsible) */}
                  {isExpanded && (
                    <CardContent className="pt-0 pb-4">
                      <div className="divide-y rounded-lg border overflow-hidden">
                        {submissions.map((sub) => {
                          const key = `${student.id}:${sub.examId}`;
                          const isGenerating = generating.has(key);
                          const hasReport = sub.hasReport === true;

                          return (
                            <div
                              key={sub.id}
                              className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{sub.exam.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted {format(new Date(sub.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                              <div className="flex-shrink-0 flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs gap-1.5"
                                  onClick={() =>
                                    setViewingAnswers({
                                      submission: sub,
                                      studentName: student.name,
                                    })
                                  }
                                >
                                  <ListChecks className="h-3.5 w-3.5" />
                                  View Answers
                                </Button>
                                {hasReport ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs gap-1.5"
                                    onClick={() => handleViewReport(student.id, sub.examId)}
                                  >
                                    <BarChart3 className="h-3.5 w-3.5" />
                                    View Report
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="gradient"
                                    className="h-8 text-xs gap-1.5"
                                    disabled={isGenerating}
                                    onClick={() => handleGenerateReport(sub.id, student.id, sub.examId)}
                                  >
                                    {isGenerating ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        AI is analyzing…
                                      </>
                                    ) : (
                                      <>
                                        <Brain className="h-3.5 w-3.5" />
                                        Generate AI Report
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {viewingAnswers && (
        <ViewAnswersModal
          submission={viewingAnswers.submission}
          studentName={viewingAnswers.studentName}
          onClose={() => setViewingAnswers(null)}
        />
      )}
    </Layout>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { examService } from "@/services/exam.service";
import { studentService } from "@/services/student.service";
import { examSessionService } from "@/services/examSessionService";
import { Exam, ExamSubmission, User } from "@/types";
import {
  BarChart3,
  Brain,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  User as UserIcon,
} from "lucide-react";
import { format } from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StudentWithSubmissions {
  student: User;
  submissions: (ExamSubmission & { exam: Exam })[];
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

  useEffect(() => {
    const load = async () => {
      try {
        const students = await studentService.getAllStudents();

        const rows: StudentWithSubmissions[] = await Promise.all(
          students.map(async (student) => {
            const subs = await examService.getSubmissionsForStudent(student.id);
            const subsWithExam = (
              await Promise.all(
                subs.map(async (sub) => {
                  const exam = await examService.getExamById(sub.examId);
                  return exam ? { ...sub, exam } : null;
                })
              )
            ).filter((s): s is ExamSubmission & { exam: Exam } => s !== null);

            return { student, submissions: subsWithExam };
          })
        );

        // Only include students who have at least one submission
        setData(rows.filter((r) => r.submissions.length > 0));
        // Auto-expand all by default
        setExpanded(new Set(rows.filter((r) => r.submissions.length > 0).map((r) => r.student.id)));
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

  const handleGenerateReport = async (studentId: string, examId: string) => {
    const key = `${studentId}:${examId}`;
    setGenerating((prev) => new Set(prev).add(key));
    // Mock 2-second AI processing delay
    await new Promise((r) => setTimeout(r, 2000));
    examSessionService.markReportGenerated(studentId, examId);
    setGenerating((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    router.push(`/teacher/reports/${studentId}/${examId}`);
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
                          const hasReport = examSessionService.hasReport(student.id, sub.examId);

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
                              <div className="flex-shrink-0">
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
                                    onClick={() => handleGenerateReport(student.id, sub.examId)}
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
    </Layout>
  );
}

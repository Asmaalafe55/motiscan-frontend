"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudentAnswerReview } from "@/components/StudentAnswerReview";
import { examService } from "@/services/exam.service";
import { ExamSubmission, Exam, Question } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Calendar, Clock, Eye, FileText, Loader2, X } from "lucide-react";
import { format } from "date-fns";

type HistorySubmission = ExamSubmission & {
  exam?: Exam | NonNullable<ExamSubmission["exam"]>;
};

function hasFullQuestions(
  exam: HistorySubmission["exam"]
): exam is Exam {
  return !!exam && "questions" in exam && Array.isArray(exam.questions) && exam.questions.length > 0;
}

// ---------------------------------------------------------------------------
// Read-only view modal
// ---------------------------------------------------------------------------
interface ViewModalProps {
  submission: HistorySubmission;
  onClose: () => void;
}

function ViewModal({ submission, onClose }: ViewModalProps) {
  const exam = submission.exam;
  const questions: Question[] = hasFullQuestions(exam) ? exam.questions : [];
  const isLoadingExam = !hasFullQuestions(exam);

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
            <FileText className="h-5 w-5 text-white flex-shrink-0" />
            <h2 className="text-base font-semibold text-white truncate">
              {exam?.title ?? "Exam Details"}
            </h2>
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
              <span>Time spent: {Math.floor(submission.timeSpent / 60)} min</span>
            </div>
          </div>

          {/* Answers */}
          {isLoadingExam ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground">Loading your answers…</p>
            </div>
          ) : questions.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700">Your Answers</p>
              {questions.map((question, idx) => {
                const answer =
                  submission.answers.find((a) => a.questionId === question.id) ??
                  submission.answers.find(
                    (a) => (a as { exerciseId?: string }).exerciseId === question.id
                  );
                return (
                  <StudentAnswerReview
                    key={question.id}
                    question={question}
                    answer={answer}
                    exerciseIndex={idx}
                    answerLabel="Your answer"
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
// Page
// ---------------------------------------------------------------------------
export default function StudentHistoryPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<HistorySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingSubmission, setViewingSubmission] = useState<HistorySubmission | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user) return;
      try {
        const submissionsData = await examService.getMySubmissions();
        setSubmissions(submissionsData);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [user]);

  const handleViewSubmission = async (submission: HistorySubmission) => {
    setViewingSubmission(submission);

    if (hasFullQuestions(submission.exam)) return;

    const fullExam = await examService.getSubmittedExamForStudent(submission.examId);
    if (!fullExam) return;

    setViewingSubmission({ ...submission, exam: fullExam });
    setSubmissions((prev) =>
      prev.map((item) =>
        item.id === submission.id ? { ...item, exam: fullExam } : item
      )
    );
  };

  if (isLoading) {
    return (
      <Layout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Exam History</h1>
          <p className="text-muted-foreground mt-1">Your completed exam submissions</p>
        </div>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <BookOpen className="h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">No exam submissions yet</p>
              <p className="text-sm text-muted-foreground">
                Complete an exam to see it here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-start justify-between gap-3">
                    <span className="text-lg leading-snug">
                      {submission.exam?.title || "Unknown Exam"}
                    </span>
                    <span className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                      Submitted
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>Time spent: {Math.floor(submission.timeSpent / 60)} min</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleViewSubmission(submission)}
                  >
                    <Eye className="h-4 w-4" />
                    View Submission
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Read-only view modal */}
      {viewingSubmission && (
        <ViewModal
          submission={viewingSubmission}
          onClose={() => setViewingSubmission(null)}
        />
      )}
    </Layout>
  );
}

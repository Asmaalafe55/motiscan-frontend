"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { examService } from "@/services/exam.service";
import { ExamSubmission, Exam } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, BookOpen, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

export default function StudentHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<(ExamSubmission & { exam?: Exam })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user) return;
      try {
        const submissionsData = await examService.getSubmissionsForStudent(user.id);
        const submissionsWithExams = await Promise.all(
          submissionsData.map(async (submission) => {
            const exam = await examService.getExamById(submission.examId);
            return { ...submission, exam: exam ?? undefined };
          })
        );
        setSubmissions(submissionsWithExams);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [user]);

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
                      <span>{format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>Time spent: {Math.floor(submission.timeSpent / 60)} min</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() =>
                      router.push(`/teacher/reports/${user!.id}/${submission.examId}`)
                    }
                  >
                    <BarChart3 className="h-4 w-4" />
                    View Report
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

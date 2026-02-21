"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { examService } from "@/services/exam.service";
import { ExamSubmission, Exam } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

export default function StudentHistoryPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<(ExamSubmission & { exam?: Exam })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user) return;
      try {
        const submissionsData = await examService.getSubmissionsByStudent(user.id);
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
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Exam History</h1>
          <p className="text-muted-foreground mt-2">View your past exam submissions</p>
        </div>

        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {submission.exam?.title || "Unknown Exam"}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {submission.exam?.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Submitted: {format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Time spent: {Math.floor(submission.timeSpent / 60)} minutes</span>
                  </div>
                  <div className="text-muted-foreground">
                    Answers submitted: {submission.answers.length} / {submission.exam?.questions.length || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {submissions.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No exam submissions yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Complete an exam to see it here
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

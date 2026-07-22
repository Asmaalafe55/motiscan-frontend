"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { examService } from "@/services/exam.service";
import { Exam } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, FileText, Clock, Pencil } from "lucide-react";
import { format } from "date-fns";

export default function TeacherExamsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      if (!user) return;
      try {
        const data = await examService.getAllExams(user.id);
        setExams(data);
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExams();
  }, [user]);

  if (isLoading) {
    return (
      <Layout role="teacher">
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="teacher">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Exams</h1>
            <p className="text-muted-foreground mt-2">Manage your exams and assessments</p>
          </div>
          <Button onClick={() => router.push("/teacher/exams/create")} variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            Create New Exam
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    <CardDescription className="mt-1">{exam.description}</CardDescription>
                  </div>
                  {exam.isLive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 shrink-0">
                      Draft
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{exam.questions.length} questions</span>
                  </div>
                  {exam.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{exam.duration} minutes</span>
                    </div>
                  )}
                  <div className="text-xs">
                    Created: {format(new Date(exam.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/teacher/exams/${exam.id}`)}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/teacher/exams/${exam.id}/edit`)}
                    title="Edit exam"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {exams.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No exams created yet</p>
              <Button
                variant="gradient" className="mt-4"
                onClick={() => router.push("/teacher/exams/create")}
              >
                Create Your First Exam
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

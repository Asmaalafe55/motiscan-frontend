"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { examService } from "@/services/exam.service";
import type { Exam } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, FileText, User } from "lucide-react";

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [liveExams, setLiveExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLiveExams = async () => {
      try {
        const exams = await examService.getLiveExamsForStudent(user.id);
        setLiveExams(exams);
      } catch (err) {
        console.error("Error fetching live exams:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveExams();

    // Poll every 5 seconds for newly opened sessions
    const interval = setInterval(fetchLiveExams, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (isLoading) {
    return (
      <Layout role="student">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Available Exams</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exams your teacher has opened for you right now
          </p>
        </div>

        {liveExams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <BookOpen className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">No live exams available</p>
              <p className="text-sm text-muted-foreground">
                Check back later or wait for your teacher to open an exam
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveExams.map((exam) => (
              <Card
                key={exam.id}
                className="hover:shadow-lg transition-shadow border-green-200"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-snug">{exam.title}</CardTitle>
                      {exam.description && (
                        <CardDescription className="mt-1 line-clamp-2">{exam.description}</CardDescription>
                      )}
                    </div>
                    <span className="ml-2 flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4" />
                      <span>{exam.questions.length} exercise{exam.questions.length !== 1 ? "s" : ""}</span>
                    </div>
                    {exam.teacherName && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        <span>{exam.teacherName}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="gradient"
                    className="w-full"
                    onClick={() => router.push(`/student/exam/${exam.id}`)}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Enter Exam
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

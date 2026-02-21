"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { examService } from "@/services/exam.service";
import { Exam } from "@/types";
import { BookOpen, Clock, FileText } from "lucide-react";
import { format } from "date-fns";

export default function StudentDashboard() {
  const router = useRouter();
  const [liveExams, setLiveExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLiveExams = async () => {
      try {
        const exams = await examService.getLiveExams();
        setLiveExams(exams);
      } catch (error) {
        console.error("Error fetching live exams:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveExams();

    // Poll every 5 seconds for new live exams
    const interval = setInterval(fetchLiveExams, 5000);

    return () => clearInterval(interval);
  }, []);

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
          <h1 className="text-3xl font-bold">Available Exams</h1>
          <p className="text-muted-foreground mt-2">Exams that are currently live</p>
        </div>

        {liveExams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No live exams available at the moment</p>
              <p className="text-sm text-muted-foreground mt-2">
                Check back later or wait for your teacher to open an exam
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveExams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-lg transition-shadow border-green-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{exam.title}</CardTitle>
                      <CardDescription className="mt-1">{exam.description}</CardDescription>
                    </div>
                    <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Live
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
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
                  </div>
                  <Button
                    className="w-full gradient-primary"
                    onClick={() => router.push(`/student/exam/${exam.id}`)}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Start Exam
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

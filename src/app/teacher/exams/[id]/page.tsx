"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { examService } from "@/services/exam.service";
import { liveSessionService } from "@/services/liveSession.service";
import { studentService } from "@/services/student.service";
import { Exam } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useLiveSession } from "@/contexts/LiveSessionContext";
import { Play, Square, Users, FileText, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const [exam, setExam] = useState<Exam | null>(null);
  const [connectedStudents, setConnectedStudents] = useState<string[]>([]);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { refreshSession } = useLiveSession();
  const { toast } = useToast();

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const data = await examService.getExamById(examId);
        setExam(data);
      } catch (error) {
        console.error("Error fetching exam:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  useEffect(() => {
    if (!exam?.isLive) return;

    const fetchStudents = async () => {
      const studentIds = await liveSessionService.getConnectedStudents(examId);
      setConnectedStudents(studentIds);
      
      // Fetch student names
      const names: Record<string, string> = {};
      await Promise.all(
        studentIds.map(async (id) => {
          const student = await studentService.getStudentById(id);
          if (student) names[id] = student.name;
        })
      );
      setStudentNames(names);
      
      refreshSession(examId);
    };

    fetchStudents();
    const interval = setInterval(fetchStudents, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [exam?.isLive, examId, refreshSession]);

  const handleOpenLiveSession = async () => {
    try {
      await examService.openLiveSession(examId);
      await liveSessionService.startLiveSession(examId);
      setExam((prev) => (prev ? { ...prev, isLive: true } : null));
      toast({
        title: "Live session started",
        description: "Students can now see and join this exam.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start live session.",
        variant: "destructive",
      });
    }
  };

  const handleCloseLiveSession = async () => {
    try {
      await examService.closeLiveSession(examId);
      await liveSessionService.endLiveSession(examId);
      setExam((prev) => (prev ? { ...prev, isLive: false } : null));
      setConnectedStudents([]);
      toast({
        title: "Live session closed",
        description: "The exam is no longer available to students.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to close live session.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout role="teacher">
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!exam) {
    return (
      <Layout role="teacher">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Exam not found</p>
            <Button className="mt-4" onClick={() => router.push("/teacher/exams")}>
              Back to Exams
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout role="teacher">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{exam.title}</h1>
            <p className="text-muted-foreground mt-2">{exam.description}</p>
          </div>
          <div className="flex gap-2">
            {exam.isLive ? (
              <Button onClick={handleCloseLiveSession} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                Close Live Session
              </Button>
            ) : (
              <Button onClick={handleOpenLiveSession} className="gradient-primary">
                <Play className="h-4 w-4 mr-2" />
                Open Live Session
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Exam Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{exam.questions.length}</strong> questions
                </span>
              </div>
              {exam.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{exam.duration}</strong> minutes
                  </span>
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Created: {format(new Date(exam.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {exam.isLive ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Live
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    Inactive
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {exam.isLive && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Connected Students
                </CardTitle>
                <CardDescription>Students currently viewing this exam</CardDescription>
              </CardHeader>
              <CardContent>
                {connectedStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No students connected yet</p>
                ) : (
                  <div className="space-y-2">
                    {connectedStudents.map((studentId) => (
                      <div key={studentId} className="flex items-center gap-2 p-2 rounded bg-muted">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm">{studentNames[studentId] || studentId}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Questions</CardTitle>
              <CardDescription>Review all questions in this exam</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {exam.questions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">Q{index + 1}:</span>
                        <span className="text-sm text-muted-foreground">
                          {question.type.replace("_", " ")}
                        </span>
                        {question.required && (
                          <span className="text-xs text-red-500">*Required</span>
                        )}
                      </div>
                      <p className="mb-2">{question.text}</p>
                      {question.options && question.options.length > 0 && (
                        <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
                          {question.options.map((option, optIndex) => (
                            <li key={optIndex}>{option}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

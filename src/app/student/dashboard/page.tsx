"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { examService } from "@/services/exam.service";
import type { Exam } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, CalendarClock, CheckCircle2, Clock, FileText, User } from "lucide-react";

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchExams = async () => {
      try {
        const assigned = await examService.getExamsForStudent(user.id);
        setExams(assigned);
      } catch (err) {
        console.error("Error fetching assigned exams:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExams();

    // Poll every 5 seconds so newly opened sessions move from Upcoming to Live.
    const interval = setInterval(fetchExams, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const liveExams = useMemo(() => exams.filter((e) => e.isLive), [exams]);
  const upcomingExams = useMemo(
    () => exams.filter((e) => !e.isLive && e.hasSubmitted !== true),
    [exams]
  );

  if (isLoading) {
    return (
      <Layout role="student">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </Layout>
    );
  }

  const hasAnyExams = liveExams.length > 0 || upcomingExams.length > 0;

  return (
    <Layout role="student">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">My Exams</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exams assigned to you by your teacher
          </p>
        </div>

        {!hasAnyExams ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <BookOpen className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">No exams assigned yet</p>
              <p className="text-sm text-muted-foreground">
                Check back later — assigned exams will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-lg font-semibold">Live Now</h2>
                <span className="text-sm text-muted-foreground">({liveExams.length})</span>
              </div>

              {liveExams.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
                    <Clock className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      No exams are open right now. Waiting for your teacher to start one.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {liveExams.map((exam) => (
                    <ExamCard key={exam.id} exam={exam} router={router} />
                  ))}
                </div>
              )}
            </section>

            {upcomingExams.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold">Upcoming / Assigned</h2>
                  <span className="text-sm text-muted-foreground">({upcomingExams.length})</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingExams.map((exam) => (
                    <ExamCard key={exam.id} exam={exam} router={router} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function ExamCard({
  exam,
  router,
}: {
  exam: Exam;
  router: ReturnType<typeof useRouter>;
}) {
  const alreadySubmitted = exam.hasSubmitted === true;
  const isLive = exam.isLive === true;

  const borderClass = alreadySubmitted
    ? "border-blue-200"
    : isLive
    ? "border-green-200"
    : "border-amber-200";

  return (
    <Card className={`hover:shadow-lg transition-shadow ${borderClass}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg leading-snug">{exam.title}</CardTitle>
            {exam.description && (
              <CardDescription className="mt-1 line-clamp-2">{exam.description}</CardDescription>
            )}
          </div>
          {alreadySubmitted ? (
            <span className="ml-2 flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Submitted
            </span>
          ) : isLive ? (
            <span className="ml-2 flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          ) : (
            <span className="ml-2 flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
              <Clock className="h-3.5 w-3.5" />
              Upcoming
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span>
              {exam.questions.length} exercise{exam.questions.length !== 1 ? "s" : ""}
            </span>
          </div>
          {exam.teacherName && (
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{exam.teacherName}</span>
            </div>
          )}
        </div>

        {alreadySubmitted ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/student/history")}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            View in History
          </Button>
        ) : isLive ? (
          <Button
            variant="gradient"
            className="w-full"
            onClick={() => router.push(`/student/exam/${exam.id}`)}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Enter Exam
          </Button>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            <Clock className="h-4 w-4 mr-2" />
            Waiting for teacher to start
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

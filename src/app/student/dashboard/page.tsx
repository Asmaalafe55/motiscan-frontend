"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { examService } from "@/services/exam.service";
import type { Exam } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, CalendarClock, CheckCircle2, Eye, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type ExamFilter = "all" | "live" | "upcoming" | "completed";

function getStatus(exam: Exam): Exclude<ExamFilter, "all"> {
  if (exam.hasSubmitted) return "completed";
  if (exam.isLive) return "live";
  return "upcoming";
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ExamFilter>("all");

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

    // Poll every 5 seconds so newly opened / submitted sessions stay in sync.
    const interval = setInterval(fetchExams, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const counts = useMemo(
    () => ({
      all: exams.length,
      live: exams.filter((e) => getStatus(e) === "live").length,
      upcoming: exams.filter((e) => getStatus(e) === "upcoming").length,
      completed: exams.filter((e) => getStatus(e) === "completed").length,
    }),
    [exams]
  );

  const visibleExams = useMemo(
    () => (filter === "all" ? exams : exams.filter((e) => getStatus(e) === filter)),
    [exams, filter]
  );

  const tabs: { key: ExamFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "live", label: "Live" },
    { key: "upcoming", label: "Upcoming" },
    { key: "completed", label: "Completed" },
  ];

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
          <h1 className="text-2xl font-bold">My Exams</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exams assigned to you by your teacher
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow"
                    : "border border-input bg-white text-foreground hover:bg-accent"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                    active ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>

        {visibleExams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <BookOpen className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">No exams to show</p>
              <p className="text-sm text-muted-foreground">
                {filter === "all"
                  ? "Your teacher hasn't assigned any exams yet"
                  : `You have no ${filter} exams right now`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} router={router} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatusBadge({ status }: { status: Exclude<ExamFilter, "all"> }) {
  if (status === "completed") {
    return (
      <span className="ml-2 flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Submitted
      </span>
    );
  }

  if (status === "live") {
    return (
      <span className="ml-2 flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        Live
      </span>
    );
  }

  return (
    <span className="ml-2 flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <CalendarClock className="h-3.5 w-3.5" />
      Upcoming
    </span>
  );
}

function ExamCard({
  exam,
  router,
}: {
  exam: Exam;
  router: ReturnType<typeof useRouter>;
}) {
  const status = getStatus(exam);
  const exerciseCount = exam.questions.length;

  return (
    <Card
      className={cn(
        "flex flex-col hover:shadow-lg transition-shadow",
        status === "live" && "border-green-200",
        status === "completed" && "border-blue-100"
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg leading-snug">{exam.title}</CardTitle>
            {exam.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {exam.description}
              </CardDescription>
            )}
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>

      <CardContent className="mt-auto space-y-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>
            {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}
          </span>
        </div>

        {status === "completed" && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/student/history")}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Results
          </Button>
        )}

        {status === "live" && (
          <Button
            variant="gradient"
            className="w-full"
            onClick={() => router.push(`/student/exam/${exam.id}`)}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Enter Exam
          </Button>
        )}

        {status === "upcoming" && (
          <Button variant="outline" className="w-full" disabled>
            <CalendarClock className="h-4 w-4 mr-2" />
            Not started yet
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

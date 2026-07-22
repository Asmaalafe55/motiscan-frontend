"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { examService } from "@/services/exam.service";
import type { Exam } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { BookOpen, CheckCircle2, Clock, Eye, FileText, User } from "lucide-react";

type ExamStatus = "live" | "upcoming" | "submitted";
type ExamFilter = "all" | ExamStatus;

function getExamStatus(exam: Exam): ExamStatus {
  if (exam.hasSubmitted === true) return "submitted";
  if (exam.isLive === true) return "live";
  return "upcoming";
}

// Lower number = higher priority. LIVE exams always float to the top.
const STATUS_PRIORITY: Record<ExamStatus, number> = {
  live: 0,
  upcoming: 1,
  submitted: 2,
};

const FILTERS: { value: ExamFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Upcoming" },
  { value: "submitted", label: "Completed" },
];

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ExamFilter>("all");

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

  const counts = useMemo(() => {
    const base: Record<ExamFilter, number> = {
      all: exams.length,
      live: 0,
      upcoming: 0,
      submitted: 0,
    };
    for (const exam of exams) base[getExamStatus(exam)]++;
    return base;
  }, [exams]);

  const filteredExams = useMemo(() => {
    const list =
      activeFilter === "all"
        ? exams
        : exams.filter((e) => getExamStatus(e) === activeFilter);

    // Prioritize LIVE exams at the top; keep original order within a status.
    return [...list].sort(
      (a, b) => STATUS_PRIORITY[getExamStatus(a)] - STATUS_PRIORITY[getExamStatus(b)]
    );
  }, [exams, activeFilter]);

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

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-transparent bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow"
                    : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {filter.label}
                <span
                  className={cn(
                    "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                    isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {counts[filter.value]}
                </span>
              </button>
            );
          })}
        </div>

        {filteredExams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <BookOpen className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">
                {activeFilter === "all"
                  ? "No exams assigned yet"
                  : `No ${FILTERS.find((f) => f.value === activeFilter)?.label.toLowerCase()} exams`}
              </p>
              <p className="text-sm text-muted-foreground">
                {activeFilter === "all"
                  ? "Check back later — assigned exams will appear here."
                  : "Try a different filter to see your other exams."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} router={router} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatusBadge({ status }: { status: ExamStatus }) {
  if (status === "submitted") {
    return (
      <span className="ml-2 flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
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
    <span className="ml-2 flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
      <Clock className="h-3.5 w-3.5" />
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
  const status = getExamStatus(exam);

  const borderClass =
    status === "submitted"
      ? "border-blue-200"
      : status === "live"
      ? "border-green-200"
      : "border-amber-200";

  return (
    <Card className={`flex flex-col hover:shadow-lg transition-shadow ${borderClass}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg leading-snug">{exam.title}</CardTitle>
            {exam.description && (
              <CardDescription className="mt-1 line-clamp-2">{exam.description}</CardDescription>
            )}
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>

      <CardContent className="mt-auto space-y-3">
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

        {status === "submitted" ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/student/history")}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Results
          </Button>
        ) : status === "live" ? (
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
            Waiting to Start
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Activity, Brain, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportService } from "@/services/report.service";
import { useLiveActivities, type ActivityItem } from "@/lib/notifications";
import { Exam, ExamSubmission, User } from "@/types";

interface RecentActivityProps {
  students: User[];
  exams: Exam[];
  submissions: ExamSubmission[];
  /** Max number of items to display. */
  limit?: number;
}

/**
 * How many of the most recent submissions we inspect for an associated AI
 * report. Bounds the number of per-report requests we make on load.
 */
const REPORT_LOOKUP_LIMIT = 20;

export function RecentActivity({
  students,
  exams,
  submissions,
  limit = 12,
}: RecentActivityProps) {
  const liveActivities = useLiveActivities();
  const [reportActivities, setReportActivities] = useState<ActivityItem[]>([]);
  // Re-render periodically so the relative timestamps stay fresh.
  const [, setTick] = useState(0);

  const studentNameById = useMemo(
    () => new Map(students.map((s) => [s.id, s.name])),
    [students]
  );
  const examTitleById = useMemo(
    () => new Map(exams.map((e) => [e.id, e.title])),
    [exams]
  );

  const resolveStudentName = (id?: string) =>
    (id && studentNameById.get(id)) || "A student";
  const resolveExamTitle = (id?: string) => (id ? examTitleById.get(id) : undefined);

  // Submission activities built directly from the submissions list.
  const submissionActivities = useMemo<ActivityItem[]>(
    () =>
      submissions.map((sub) => ({
        id: `sub-${sub.id}`,
        type: "submission" as const,
        studentId: sub.studentId,
        studentName: resolveStudentName(sub.studentId),
        examId: sub.examId,
        examTitle: sub.exam?.title ?? resolveExamTitle(sub.examId),
        timestamp: sub.submittedAt,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [submissions, studentNameById, examTitleById]
  );

  // Enrich the feed with AI report events (fetch generatedAt for recent reports).
  useEffect(() => {
    let cancelled = false;

    const recentWithReports = [...submissions]
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )
      .slice(0, REPORT_LOOKUP_LIMIT)
      .filter((s) => s.hasReport);

    Promise.all(
      recentWithReports.map(async (sub) => {
        try {
          const report = await reportService.getReportBySubmission(sub.id);
          if (!report) return null;
          const item: ActivityItem = {
            id: `report-${report.id}`,
            type: "report",
            studentId: sub.studentId,
            studentName: resolveStudentName(sub.studentId),
            examId: sub.examId,
            examTitle: sub.exam?.title ?? resolveExamTitle(sub.examId),
            timestamp: report.generatedAt,
          };
          return item;
        } catch {
          return null;
        }
      })
    ).then((items) => {
      if (cancelled) return;
      setReportActivities(items.filter((i): i is ActivityItem => i !== null));
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissions, studentNameById, examTitleById]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const items = useMemo(() => {
    // Live items may arrive without a resolved exam title — fill it in here.
    const enrichedLive = liveActivities.map((item) => ({
      ...item,
      examTitle: item.examTitle ?? resolveExamTitle(item.examId),
      studentName:
        item.studentName && item.studentName !== item.studentId
          ? item.studentName
          : resolveStudentName(item.studentId),
    }));

    const merged = [...enrichedLive, ...reportActivities, ...submissionActivities];

    // De-duplicate by id, keeping the first (live/report take precedence).
    const seen = new Set<string>();
    const unique = merged.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    return unique
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveActivities, reportActivities, submissionActivities, examTitleById, studentNameById, limit]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-blue-600" />
            Recent Activity
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Activity className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No recent activity yet</p>
            <p className="text-xs text-muted-foreground">
              Student submissions and AI reports will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const isReport = item.type === "report";

  const timeAgo = (() => {
    const date = new Date(item.timestamp);
    if (Number.isNaN(date.getTime())) return "";
    return formatDistanceToNow(date, { addSuffix: true });
  })();

  return (
    <li className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40">
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
          isReport ? "bg-violet-100" : "bg-blue-100"
        }`}
      >
        {isReport ? (
          <Brain className="h-4 w-4 text-violet-600" />
        ) : (
          <FileText className="h-4 w-4 text-blue-600" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          {isReport ? (
            <>
              New AI evaluation report generated for{" "}
              <span className="font-semibold">{item.studentName}</span>
            </>
          ) : (
            <>
              <span className="font-semibold">{item.studentName}</span> submitted{" "}
              {item.examTitle ? (
                <span className="font-medium">{item.examTitle}</span>
              ) : (
                "a new response"
              )}
            </>
          )}
        </p>
        {isReport && item.examTitle && (
          <p className="truncate text-xs text-muted-foreground">{item.examTitle}</p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo}</p>
      </div>
    </li>
  );
}

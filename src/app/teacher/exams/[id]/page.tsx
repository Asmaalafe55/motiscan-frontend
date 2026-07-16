"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { examService } from "@/services/exam.service";
import { liveSessionService } from "@/services/liveSession.service";
import { studentService } from "@/services/student.service";
import { useExamSession } from "@/hooks/useExamSession";
import { ExercisePreviewModal } from "@/components/exercises/ExercisePreviewModal";
import { exerciseLibraryService } from "@/services/exerciseLibrary.service";
import type { Exam, Exercise, ExamSubmission, User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useLiveSession } from "@/contexts/LiveSessionContext";
import { connectSocket } from "@/lib/socket";
import {
  BookOpen,
  Clock,
  Eye,
  FileText,
  ImageIcon,
  Pencil,
  Play,
  Square,
  Users,
  Star,
  SlidersHorizontal,
  BarChart2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TYPE_BADGE: Record<string, string> = {
  differences:     "bg-blue-100 text-blue-700",
  rating_scale:    "bg-pink-100 text-pink-700",
  multiple_choice: "bg-sky-100 text-sky-700",
  likert_scale:    "bg-purple-100 text-purple-700",
};
const TYPE_LABEL: Record<string, string> = {
  differences:     "Differences",
  rating_scale:    "Rating Scale",
  multiple_choice: "Multiple Choice",
  likert_scale:    "Likert Scale",
};
const TYPE_ICON: Record<string, React.ReactNode> = {
  differences:     <ImageIcon className="h-3.5 w-3.5" />,
  rating_scale:    <Star className="h-3.5 w-3.5" />,
  multiple_choice: <SlidersHorizontal className="h-3.5 w-3.5" />,
  likert_scale:    <SlidersHorizontal className="h-3.5 w-3.5" />,
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatElapsed(startedAt: string) {
  const ms = Date.now() - new Date(startedAt).getTime();
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const { toast } = useToast();
  const { refreshSession, setActiveExamId } = useLiveSession();

  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedStudents, setAssignedStudents] = useState<User[]>([]);
  const [libraryExercises, setLibraryExercises] = useState<Record<string, Exercise>>({});
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [reportLoadingFor, setReportLoadingFor] = useState<string | null>(null);

  // Live session hook (auto-polls every 10s when isLive)
  const { connectedStudentIds, sessions, studentNames } = useExamSession(
    examId,
    !!exam?.isLive
  );

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await examService.getExamById(examId);
        setExam(data);

        // Load assigned students
        if (data?.assignedStudentIds?.length) {
          const students = await studentService.getStudentsByIds(data.assignedStudentIds);
          setAssignedStudents(students);
        }

        // Load library exercises for preview (if exerciseIds exist)
        if (data?.exerciseIds?.length) {
          const exs = await exerciseLibraryService.getExercisesByIds(data.exerciseIds);
          const map: Record<string, Exercise> = {};
          exs.forEach((e) => { map[e.id] = e; });
          setLibraryExercises(map);
        }

        // Load submissions so we know which students have submitted
        const subs = await examService.getSubmissionsForExam(examId);
        setSubmissions(subs);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [examId]);

  // Refresh live context when session changes
  useEffect(() => {
    if (exam?.isLive) refreshSession(examId);
  }, [exam?.isLive, examId, refreshSession]);

  // Re-join socket room when page loads with an already-live exam
  useEffect(() => {
    if (exam?.isLive) {
      setActiveExamId(examId);
      const socket = connectSocket();
      const open = () => {
        socket.emit("teacher:openSession", { examId });
        liveSessionService.startLiveSession(examId);
        refreshSession(examId);
      };
      if (socket.connected) {
        open();
      } else {
        socket.connect();
        socket.once("connect", open);
      }
    }
    return () => setActiveExamId(null);
  }, [exam?.isLive, examId, refreshSession, setActiveExamId]);

  const handleOpenSession = async () => {
    try {
      await examService.openLiveSession(examId);
      await liveSessionService.startLiveSession(examId);
      setExam((prev) => prev ? { ...prev, isLive: true } : null);
      toast({ title: "Live session started", description: "Students can now join this exam." });
    } catch {
      toast({ title: "Error", description: "Failed to start session.", variant: "destructive" });
    }
  };

  const handleCloseSession = async () => {
    try {
      await examService.closeLiveSession(examId);
      await liveSessionService.endLiveSession(examId);
      setExam((prev) => prev ? { ...prev, isLive: false } : null);
      toast({ title: "Session closed", description: "The exam is no longer available to students." });
    } catch {
      toast({ title: "Error", description: "Failed to close session.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Layout role="teacher">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading exam…</p>
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
            <Button className="mt-4" onClick={() => router.push("/teacher/exams")}>Back to Exams</Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  // ---- Students who have a submission ----
  const submittedStudentIds = new Set(submissions.map((s) => s.studentId));

  const handleGetReport = async (studentId: string) => {
    setReportLoadingFor(studentId);
    // Navigate — the report page itself shows the 2-second AI loading state
    router.push(`/teacher/reports/${studentId}/${examId}`);
  };

  // Students currently active (socket-connected or DB session online/away)
  const activeStudentIds = Array.from(
    new Set([
      ...connectedStudentIds,
      ...sessions
        .filter((s) => s.status === "online" || s.status === "away")
        .map((s) => s.studentId),
    ])
  );

  const onlineSet = new Set(activeStudentIds);
  const offlineStudents = assignedStudents.filter((s) => !onlineSet.has(s.id));

  // ---- For timeline rendering ----
  const getSession = (sid: string) => sessions.find((s) => s.studentId === sid);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Layout role="teacher">
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            {exam.description && (
              <p className="text-sm text-muted-foreground mt-1">{exam.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {exam.isLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                  Draft
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                Created {format(new Date(exam.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {!exam.isLive && (
              <Button
                variant="outline"
                onClick={() => router.push(`/teacher/exams/${examId}/edit`)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Exam
              </Button>
            )}
            <Button
              variant="outline"
              disabled={exam.isLive}
              className="text-muted-foreground"
              title="Available after session closes"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            {exam.isLive ? (
              <Button onClick={handleCloseSession} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                Close Session
              </Button>
            ) : (
              <Button onClick={handleOpenSession} variant="gradient">
                <Play className="h-4 w-4 mr-2" />
                Open Live Session
              </Button>
            )}
          </div>
        </div>

        {/* ── Two-panel layout ── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* ═══════════════════════════════════════
              LEFT PANEL — Exam Structure
          ═══════════════════════════════════════ */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Exercises in This Exam
                </CardTitle>
                <CardDescription>
                  {exam.questions.length} exercise{exam.questions.length !== 1 ? "s" : ""}
                  {exam.exerciseIds?.length ? " · sourced from library" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {exam.questions.map((q, idx) => {
                  const libEx = exam.exerciseIds?.[idx]
                    ? libraryExercises[exam.exerciseIds[idx]]
                    : undefined;

                  // Build a fake Exercise for preview if library exercise not available
                  const previewTarget: Exercise | null = libEx ?? {
                    id: q.id,
                    title: `Exercise ${idx + 1}`,
                    type: q.type,
                    instructions: q.text,
                    content: "",
                    tags: [],
                    createdAt: exam.createdAt,
                    question: q,
                  };

                  return (
                    <div key={q.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors group">
                      <span className="text-sm font-bold text-muted-foreground w-6 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className={`flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 flex-shrink-0 ${TYPE_BADGE[q.type] ?? "bg-gray-100 text-gray-700"}`}>
                        {TYPE_ICON[q.type]}
                        {TYPE_LABEL[q.type] ?? q.type}
                      </span>
                      <span className="text-sm flex-1 line-clamp-1">{libEx?.title ?? q.text}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setPreviewExercise(previewTarget)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Preview
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Assigned students summary */}
            {assignedStudents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    Assigned Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {assignedStudents.map((s) => (
                      <div key={s.id} className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm">
                        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                          {getInitials(s.name)}
                        </span>
                        {s.name}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ═══════════════════════════════════════
              RIGHT PANEL — Live Student Panel
          ═══════════════════════════════════════ */}
          <div className="space-y-4">
            {/* Section A — Online Now */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  {exam.isLive ? "Students Online Now" : "Live Panel"}
                </CardTitle>
                {exam.isLive && (
                  <CardDescription className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    Auto-refreshes every 10 seconds
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {!exam.isLive ? (
                  <p className="text-sm text-muted-foreground">
                    Open the live session to start monitoring students in real time.
                  </p>
                ) : activeStudentIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No students connected yet.</p>
                ) : (
                  <div className="space-y-3">
                    {activeStudentIds.map((sid) => {
                      const session = getSession(sid);
                      const user = studentNames[sid];
                      const name = user?.name ?? sid;

                      const statusLabel =
                        session?.status === "submitted" ? "Submitted" :
                        session?.status === "away" ? "Idle" : "Solving";

                      const statusDot =
                        session?.status === "submitted" ? "bg-blue-500" :
                        session?.status === "away" ? "bg-yellow-400" :
                        "bg-green-500 animate-pulse";

                      const statusBadge =
                        session?.status === "submitted" ? "bg-blue-100 text-blue-700" :
                        session?.status === "away" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700";

                      return (
                        <div key={sid} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="relative">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                  {getInitials(name)}
                                </div>
                                <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${statusDot}`} />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{name}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {session
                                    ? `Exercise ${session.currentExerciseIndex + 1} of ${session.totalExercises}`
                                    : "Connecting…"}
                                </p>
                              </div>
                            </div>
                            <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${statusBadge}`}>
                              {statusLabel}
                            </span>
                          </div>

                          {session && (
                            <div className="flex gap-4 text-[11px] text-muted-foreground">
                              <span>⏱ In exam: {formatElapsed(session.startedAt)}</span>
                              <span>
                                Last activity: {formatDistanceToNow(new Date(session.lastActivityAt), { addSuffix: true })}
                              </span>
                            </div>
                          )}

                          {session && session.timeline.length > 0 && (
                            <div className="border-t pt-2">
                              <p className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Timeline</p>
                              <div className="max-h-20 overflow-y-auto space-y-0.5">
                                {session.timeline.slice(-5).map((ev, i) => (
                                  <div key={i} className="flex gap-2 text-[10px]">
                                    <span className="text-muted-foreground flex-shrink-0">
                                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    <span>Exercise {ev.exerciseIndex + 1} – {ev.action}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Get Report button — shown for submitted students */}
                          {(session?.status === "submitted" || submittedStudentIds.has(sid)) && (
                            <div className="border-t pt-2">
                              <Button
                                size="sm"
                                variant="gradient"
                                className="w-full h-7 text-xs"
                                disabled={reportLoadingFor === sid}
                                onClick={() => handleGetReport(sid)}
                              >
                                <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
                                {reportLoadingFor === sid ? "Opening…" : "View AI Report"}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section B — Submitted students (always shown when there are submissions) */}
            {submissions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart2 className="h-4 w-4 text-blue-600" />
                    Submitted — AI Reports Available
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {submissions.map((sub) => {
                    const student = assignedStudents.find((s) => s.id === sub.studentId);
                    const name = student?.name ?? sub.studentId;
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center gap-2.5 rounded-lg border p-2.5 bg-blue-50/50"
                      >
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                          {name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Submitted {format(new Date(sub.submittedAt), "MMM d 'at' h:mm a")}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="gradient"
                          className="h-7 text-xs flex-shrink-0"
                          disabled={reportLoadingFor === sub.studentId}
                          onClick={() => handleGetReport(sub.studentId)}
                        >
                          <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
                          {reportLoadingFor === sub.studentId ? "Opening…" : "View AI Report"}
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Section C — Assigned but offline */}
            {exam.isLive && offlineStudents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-muted-foreground">
                    Assigned — Not Connected
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {offlineStudents.map((student) => {
                    const session = getSession(student.id);
                    return (
                      <div key={student.id} className="flex items-center gap-2.5 rounded-lg border p-2.5 bg-muted/20">
                        <div className="relative">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                            {getInitials(student.name)}
                          </div>
                          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-background bg-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {session
                              ? `Last seen ${formatDistanceToNow(new Date(session.lastActivityAt), { addSuffix: true })}`
                              : "Not started"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <Badge variant="secondary" className="text-[10px]">
                            Offline
                          </Badge>
                          {submittedStudentIds.has(student.id) && (
                            <Button
                              size="sm"
                              variant="gradient"
                              className="h-6 text-[10px] px-2"
                              disabled={reportLoadingFor === student.id}
                              onClick={() => handleGetReport(student.id)}
                            >
                              <BarChart2 className="h-3 w-3 mr-1" />
                              {reportLoadingFor === student.id ? "Opening…" : "View AI Report"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal */}
      <ExercisePreviewModal
        exercise={previewExercise}
        open={!!previewExercise}
        onClose={() => setPreviewExercise(null)}
      />
    </Layout>
  );
}

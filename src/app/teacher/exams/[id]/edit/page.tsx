"use client";

import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exerciseLibraryService } from "@/services/exerciseLibrary.service";
import { examService } from "@/services/exam.service";
import { studentService } from "@/services/student.service";
import { useToast } from "@/hooks/use-toast";
import { ExercisePreviewModal } from "@/components/exercises/ExercisePreviewModal";
import type { Exercise, User } from "@/types";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  Eye,
  ImageIcon,
  Loader2,
  Lock,
  Plus,
  Save,
  Star,
  SlidersHorizontal,
  UserCheck,
  X,
} from "lucide-react";

const examSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});
type ExamFormData = z.infer<typeof examSchema>;

const TYPE_BADGE: Record<string, string> = {
  differences: "bg-blue-100 text-blue-700",
  rating_scale: "bg-pink-100 text-pink-700",
  multiple_choice: "bg-sky-100 text-sky-700",
  likert_scale: "bg-purple-100 text-purple-700",
};
const TYPE_LABEL: Record<string, string> = {
  differences: "Differences",
  rating_scale: "Rating Scale",
  multiple_choice: "Multiple Choice",
  likert_scale: "Likert Scale",
};
const TYPE_ICON: Record<string, React.ReactNode> = {
  differences: <ImageIcon className="h-3.5 w-3.5" />,
  rating_scale: <Star className="h-3.5 w-3.5" />,
  multiple_choice: <SlidersHorizontal className="h-3.5 w-3.5" />,
  likert_scale: <SlidersHorizontal className="h-3.5 w-3.5" />,
};

function typeBadge(type: string) {
  return TYPE_BADGE[type] ?? "bg-gray-100 text-gray-700";
}

function EditExamForm() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = params.id as string;
  const { toast } = useToast();

  // Where the teacher came from: "list" (main Exams page) or "details"
  // (the read-only View Details screen). Defaults to View Details.
  const cameFromList = searchParams.get("from") === "list";
  const cancelHref = cameFromList ? "/teacher/exams" : `/teacher/exams/${examId}`;

  const [libraryExercises, setLibraryExercises] = useState<Exercise[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [librarySearch, setLibrarySearch] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [initialIsLive, setInitialIsLive] = useState(false);
  const [duration, setDuration] = useState("");
  // Number of students who have actively started but not yet submitted.
  const [activeStudentCount, setActiveStudentCount] = useState(0);
  const [showLiveWarning, setShowLiveWarning] = useState(false);

  // Soft lock: only restrict core question structure when the exam was already
  // live AND at least one student is actively taking it. If nobody has started
  // (activeStudentCount === 0), full editing stays allowed.
  const softLocked = initialIsLive && activeStudentCount > 0;
  const lockTooltip = "Cannot be modified while exam is LIVE";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: { title: "", description: "" },
  });

  // Discard any unsaved edits and return to the originating screen.
  const handleCancel = () => {
    reset();
    router.push(cancelHref);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [exs, students, exam] = await Promise.all([
          exerciseLibraryService.getAllExercises(),
          studentService.getAllStudents(),
          examService.getExamById(examId),
        ]);

        if (!exam) {
          toast({ title: "Exam not found", variant: "destructive" });
          router.push("/teacher/exams");
          return;
        }

        setIsLive(exam.isLive);
        setInitialIsLive(exam.isLive);
        setDuration(exam.duration ? String(exam.duration) : "");
        setLibraryExercises(exs);
        setAllStudents(students);
        reset({ title: exam.title, description: exam.description ?? "" });
        setSelectedStudentIds(exam.assignedStudentIds ?? []);

        if (exam.exerciseIds?.length) {
          const ordered = exam.exerciseIds
            .map((id) => exs.find((e) => e.id === id))
            .filter((e): e is Exercise => Boolean(e));
          setSelectedExercises(ordered);
        }

        // When editing a LIVE exam, warn the teacher and determine how many
        // students are actively taking it (online/away = started, not submitted).
        if (exam.isLive) {
          const sessions = await examService.getExamSessions(examId);
          const active = sessions.filter(
            (s) => s.status === "online" || s.status === "away"
          ).length;
          setActiveStudentCount(active);
          setShowLiveWarning(true);
        }
      } catch {
        toast({ title: "Error", description: "Failed to load exam.", variant: "destructive" });
      } finally {
        setLibraryLoading(false);
        setPageLoading(false);
      }
    };
    load();
  }, [examId, reset, router, toast]);

  const filteredLibrary = libraryExercises.filter((ex) => {
    const q = librarySearch.toLowerCase();
    return (
      !q ||
      ex.title.toLowerCase().includes(q) ||
      ex.type.includes(q) ||
      ex.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const isSelected = (id: string) => selectedExercises.some((e) => e.id === id);

  const toggleExercise = (ex: Exercise) => {
    // Adding/removing questions alters the exam structure — locked while live.
    if (softLocked) return;
    if (isSelected(ex.id)) {
      setSelectedExercises((prev) => prev.filter((e) => e.id !== ex.id));
    } else {
      setSelectedExercises((prev) => [...prev, ex]);
    }
  };

  const removeSelected = (id: string) => {
    if (softLocked) return;
    setSelectedExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const moveUp = (idx: number) => {
    if (softLocked || idx === 0) return;
    setSelectedExercises((prev) => {
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
  };

  const moveDown = (idx: number) => {
    if (softLocked) return;
    setSelectedExercises((prev) => {
      if (idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data: ExamFormData) => {
    if (selectedExercises.length === 0) {
      toast({
        title: "No exercises selected",
        description: "Add at least one exercise.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await examService.updateExam(examId, {
        title: data.title,
        description: data.description ?? "",
        isLive,
        duration: duration ? Number(duration) : undefined,
        exerciseIds: selectedExercises.map((e) => e.id),
        assignedStudentIds: selectedStudentIds,
        questions: selectedExercises.map((ex, index) => ({
          ...ex.question,
          id: `${ex.question.id}-edit-${index}`,
          examId,
          order: index + 1,
        })),
      });

      if (!updated) throw new Error("Update failed");

      // Open/close the live session (and notify students via socket) only when
      // the teacher flipped the toggle while editing.
      if (isLive !== initialIsLive) {
        if (isLive) {
          await examService.openLiveSession(examId);
        } else {
          await examService.closeLiveSession(examId);
        }
        setInitialIsLive(isLive);
      }

      toast({
        title: "Exam updated",
        description:
          isLive !== initialIsLive
            ? isLive
              ? "Changes saved. The exam is now live and visible to students."
              : "Changes saved. The exam is now a draft and hidden from students."
            : "Changes saved successfully.",
      });
      router.push(`/teacher/exams/${examId}`);
    } catch {
      toast({
        title: "Error",
        description: "Failed to update exam. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout role="teacher">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading exam…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="teacher">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Edit Exam</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLive
                ? "This exam is live and visible to students. Toggle off to return it to a draft."
                : "Toggle on to make this exam live and visible to students, then save your changes."}
            </p>
          </div>
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2 shrink-0"
            title={isLive ? "Set exam to draft" : "Set exam live"}
          >
            <Switch
              checked={isLive}
              onCheckedChange={setIsLive}
              onLabel="Live"
              offLabel="Off"
            />
          </div>
        </div>

        {softLocked && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">
                This exam is currently LIVE — {activeStudentCount} student
                {activeStudentCount === 1 ? " is" : "s are"} in progress.
              </p>
              <p>
                Core question structure is locked to protect active submissions.
                You can still edit the instructions, duration, question phrasing,
                and assigned students.
              </p>
            </div>
          </div>
        )}

        {initialIsLive && !softLocked && (
          <div className="flex items-start gap-3 rounded-lg border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">This exam is live.</p>
              <p>
                No students have started yet, so full editing is allowed. Changes
                made after a student begins may affect their submission.
              </p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader><CardTitle>Exam Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Exam Name *</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description / Instructions</Label>
              <Textarea id="description" rows={2} {...register("description")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={0}
                placeholder="Unlimited"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for unlimited time.
                {softLocked && " You can still extend or shorten the duration while the exam is live."}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Exercise Library
                {softLocked && (
                  <Tooltip content={lockTooltip}>
                    <Lock className="h-3.5 w-3.5 text-amber-600" />
                  </Tooltip>
                )}
              </CardTitle>
              <div className="relative mt-1">
                <Input
                  className="pl-8 h-8 text-sm"
                  placeholder="Search exercises…"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                />
                <BookOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
              {softLocked && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                  <Lock className="h-3 w-3" />
                  Adding or removing questions is locked while the exam is live.
                </p>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-96 space-y-2 pt-0">
              {libraryLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                filteredLibrary.map((ex) => {
                  const sel = isSelected(ex.id);
                  return (
                    <div
                      key={ex.id}
                      onClick={() => toggleExercise(ex)}
                      title={softLocked ? lockTooltip : undefined}
                      className={`flex items-start gap-2 rounded-lg border p-2.5 transition-colors ${
                        softLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                      } ${
                        sel ? "border-blue-400 bg-blue-50" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className={`mt-0.5 rounded-full border-2 h-4 w-4 flex-shrink-0 flex items-center justify-center ${sel ? "border-blue-500 bg-blue-500" : "border-muted-foreground"}`}>
                        {sel && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium line-clamp-1">{ex.title}</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={(e) => { e.stopPropagation(); setPreviewExercise(ex); }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Selected Exercises</span>
                {selectedExercises.length > 0 && (
                  <Badge variant="secondary">{selectedExercises.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
              {selectedExercises.length === 0 ? (
                <p className="text-sm text-muted-foreground">Select exercises from the library</p>
              ) : (
                <div className="space-y-2">
                  {selectedExercises.map((ex, idx) => (
                    <div key={ex.id} className="flex items-center gap-2 rounded-lg border p-2.5 bg-muted/30">
                      <span className="text-xs font-bold text-muted-foreground w-5">{idx + 1}</span>
                      <span className={`text-[10px] font-medium rounded-full px-1.5 py-0.5 ${typeBadge(ex.type)}`}>
                        {TYPE_LABEL[ex.type] ?? ex.type}
                      </span>
                      <span className="text-sm font-medium flex-1 line-clamp-1">{ex.title}</span>
                      <div className="flex items-center gap-0.5">
                        {softLocked ? (
                          <Tooltip content={lockTooltip}>
                            <span className="inline-flex h-6 w-6 items-center justify-center text-amber-600">
                              <Lock className="h-3.5 w-3.5" />
                            </span>
                          </Tooltip>
                        ) : (
                          <>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveUp(idx)} disabled={idx === 0}>
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveDown(idx)} disabled={idx === selectedExercises.length - 1}>
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeSelected(ex.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Assign Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {allStudents.map((student) => {
                const sel = selectedStudentIds.includes(student.id);
                const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <button
                    type="button"
                    key={student.id}
                    onClick={() => toggleStudent(student.id)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      sel ? "border-blue-500 bg-blue-100 text-blue-800" : "border-border hover:bg-muted"
                    }`}
                  >
                    <span className={`h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center ${sel ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"}`}>
                      {initials}
                    </span>
                    {student.name}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Save Changes</>
            )}
          </Button>
        </div>
      </form>

      <ExercisePreviewModal
        exercise={previewExercise}
        open={!!previewExercise}
        onClose={() => setPreviewExercise(null)}
      />

      <Dialog open={showLiveWarning} onOpenChange={setShowLiveWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              This exam is currently LIVE!
            </DialogTitle>
            <DialogDescription>
              Modifying core question structures may affect active student
              submissions.
            </DialogDescription>
          </DialogHeader>

          {softLocked ? (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {activeStudentCount} student
                {activeStudentCount === 1 ? " has" : "s have"} already started
                this exam, so some fields are locked to protect their work.
              </p>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="font-semibold text-green-800">You can still edit:</p>
                <ul className="mt-1 list-disc pl-5 text-green-700">
                  <li>General instructions &amp; description</li>
                  <li>Exam duration</li>
                  <li>Assigned students</li>
                  <li>Question text / phrasing</li>
                </ul>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="flex items-center gap-1.5 font-semibold text-amber-800">
                  <Lock className="h-3.5 w-3.5" />
                  Locked while live:
                </p>
                <ul className="mt-1 list-disc pl-5 text-amber-700">
                  <li>Adding, removing, or reordering questions</li>
                  <li>Changing correct answers or point weights</li>
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No students have started this exam yet, so you can edit freely.
              Please save your changes before students begin — edits made after a
              student starts may affect their submission.
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="gradient" onClick={() => setShowLiveWarning(false)}>
              I understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

// ---------------------------------------------------------------------------
// Page — wraps the form in Suspense (required for useSearchParams in Next.js)
// ---------------------------------------------------------------------------
export default function EditExamPage() {
  return (
    <Suspense
      fallback={
        <Layout role="teacher">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading exam…</p>
          </div>
        </Layout>
      }
    >
      <EditExamForm />
    </Suspense>
  );
}

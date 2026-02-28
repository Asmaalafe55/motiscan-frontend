"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { exerciseLibraryService } from "@/services/exerciseLibrary.service";
import { examService } from "@/services/exam.service";
import { studentService } from "@/services/student.service";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ExercisePreviewModal } from "@/components/exercises/ExercisePreviewModal";
import type { Exercise, User } from "@/types";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  Eye,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  Star,
  SlidersHorizontal,
  UserCheck,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const examSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  saveAsTemplate: z.boolean(),
});
type ExamFormData = z.infer<typeof examSchema>;

// ---------------------------------------------------------------------------
// Type badge helpers
// ---------------------------------------------------------------------------
const TYPE_BADGE: Record<string, string> = {
  differences:         "bg-blue-100 text-blue-700",
  open_text:           "bg-yellow-100 text-yellow-700",
  rating_scale:        "bg-pink-100 text-pink-700",
  multiple_choice:     "bg-sky-100 text-sky-700",
  likert_scale:        "bg-purple-100 text-purple-700",
};
const TYPE_LABEL: Record<string, string> = {
  differences:         "Differences",
  open_text:           "Open Text",
  rating_scale:        "Rating Scale",
  multiple_choice:     "Multiple Choice",
  likert_scale:        "Likert Scale",
};
const TYPE_ICON: Record<string, React.ReactNode> = {
  differences:     <ImageIcon className="h-3.5 w-3.5" />,
  open_text:       <BookOpen className="h-3.5 w-3.5" />,
  rating_scale:    <Star className="h-3.5 w-3.5" />,
  multiple_choice: <SlidersHorizontal className="h-3.5 w-3.5" />,
  likert_scale:    <SlidersHorizontal className="h-3.5 w-3.5" />,
};

function typeBadge(type: string) {
  return TYPE_BADGE[type] ?? "bg-gray-100 text-gray-700";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function CreateExamPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  // Library data
  const [libraryExercises, setLibraryExercises] = useState<Exercise[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [librarySearch, setLibrarySearch] = useState("");

  // Selection state
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);

  // Students
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Preview
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

  // Form
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: { title: "", description: "", saveAsTemplate: false },
  });
  const saveAsTemplate = watch("saveAsTemplate");

  useEffect(() => {
    const load = async () => {
      const [exs, students] = await Promise.all([
        exerciseLibraryService.getAllExercises(),
        studentService.getAllStudents(),
      ]);
      setLibraryExercises(exs);
      setAllStudents(students);
      setLibraryLoading(false);
    };
    load();
  }, []);

  // ---- Filtered library ----
  const filteredLibrary = libraryExercises.filter((ex) => {
    const q = librarySearch.toLowerCase();
    return (
      !q ||
      ex.title.toLowerCase().includes(q) ||
      ex.type.includes(q) ||
      ex.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  // ---- Exercise selection ----
  const isSelected = (id: string) => selectedExercises.some((e) => e.id === id);

  const toggleExercise = (ex: Exercise) => {
    if (isSelected(ex.id)) {
      setSelectedExercises((prev) => prev.filter((e) => e.id !== ex.id));
    } else {
      setSelectedExercises((prev) => [...prev, ex]);
    }
  };

  const removeSelected = (id: string) =>
    setSelectedExercises((prev) => prev.filter((e) => e.id !== id));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setSelectedExercises((prev) => {
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
  };

  const moveDown = (idx: number) => {
    setSelectedExercises((prev) => {
      if (idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  };

  // ---- Student selection ----
  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // ---- Submit ----
  const onSubmit = async (data: ExamFormData) => {
    if (!user) return;
    if (selectedExercises.length === 0) {
      toast({ title: "No exercises selected", description: "Add at least one exercise.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const exam = await examService.createExam({
        title: data.title,
        description: data.description ?? "",
        teacherId: user.id,
        teacherName: user.name,
        exerciseIds: selectedExercises.map((e) => e.id),
        assignedStudentIds: selectedStudentIds,
        questions: selectedExercises.map((ex, index) => ({
          ...ex.question,
          id: `${ex.question.id}-${Date.now()}-${index}`,
          examId: "",
          order: index + 1,
        })),
      });

      if (data.saveAsTemplate) {
        await exerciseLibraryService.createTemplateFromExam(exam);
      }

      toast({ title: "Exam created", description: "Your exam has been saved." });
      router.push(`/teacher/exams/${exam.id}`);
    } catch {
      toast({ title: "Error", description: "Failed to create exam.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Layout role="teacher">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create New Exam</h1>
          <p className="text-sm text-muted-foreground">Select exercises from your library and assign students</p>
        </div>

        {/* ── Exam details ── */}
        <Card>
          <CardHeader><CardTitle>Exam Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Exam Name *</Label>
              <Input id="title" {...register("title")} placeholder="e.g. Motivation Assessment — Class 4A" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea id="description" rows={2} {...register("description")} placeholder="Brief description of this exam's purpose" />
            </div>
          </CardContent>
        </Card>

        {/* ── Exercise selection ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: library */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Exercise Library</CardTitle>
              <div className="relative mt-1">
                <Input
                  className="pl-8 h-8 text-sm"
                  placeholder="Search exercises…"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                />
                <BookOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-96 space-y-2 pt-0">
              {libraryLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : filteredLibrary.length === 0 ? (
                <p className="text-sm text-muted-foreground">No exercises found.</p>
              ) : (
                filteredLibrary.map((ex) => {
                  const sel = isSelected(ex.id);
                  return (
                    <div
                      key={ex.id}
                      onClick={() => toggleExercise(ex)}
                      className={`flex items-start gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                        sel
                          ? "border-blue-400 bg-blue-50"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className={`mt-0.5 rounded-full border-2 h-4 w-4 flex-shrink-0 flex items-center justify-center ${sel ? "border-blue-500 bg-blue-500" : "border-muted-foreground"}`}>
                        {sel && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium line-clamp-1">{ex.title}</span>
                          <span className={`text-[10px] font-medium rounded-full px-1.5 py-0.5 ${typeBadge(ex.type)}`}>
                            {TYPE_LABEL[ex.type] ?? ex.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ex.instructions}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={(e) => { e.stopPropagation(); setPreviewExercise(ex); }}
                        title="Preview"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Right: selected exercises */}
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
                <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
                  <Plus className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Click exercises in the library to add them</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedExercises.map((ex, idx) => (
                    <div key={ex.id} className="flex items-center gap-2 rounded-lg border p-2.5 bg-muted/30">
                      <span className="text-xs font-bold text-muted-foreground w-5 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className={`flex items-center gap-1 text-[10px] font-medium rounded-full px-1.5 py-0.5 flex-shrink-0 ${typeBadge(ex.type)}`}>
                        {TYPE_ICON[ex.type]}
                      </span>
                      <span className="text-sm font-medium flex-1 line-clamp-1">{ex.title}</span>
                      <div className="flex gap-0.5">
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveUp(idx)} disabled={idx === 0}>
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveDown(idx)} disabled={idx === selectedExercises.length - 1}>
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeSelected(ex.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Assign students ── */}
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
                      sel
                        ? "border-blue-500 bg-blue-100 text-blue-800"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <span className={`h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center ${sel ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"}`}>
                      {initials}
                    </span>
                    {student.name}
                    {sel && <X className="h-3 w-3 opacity-60" />}
                  </button>
                );
              })}
            </div>
            {selectedStudentIds.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? "s" : ""} assigned
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Save as template ── */}
        <Card>
          <CardContent className="pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setValue("saveAsTemplate", !saveAsTemplate)}
                className={`h-5 w-9 rounded-full transition-colors flex items-center px-0.5 ${saveAsTemplate ? "bg-blue-600" : "bg-muted"}`}
              >
                <div className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${saveAsTemplate ? "translate-x-4" : "translate-x-0"}`} />
              </div>
              <div>
                <p className="text-sm font-medium">Save as Template</p>
                <p className="text-xs text-muted-foreground">Reuse this exam structure in future exams</p>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Save Exam</>
            )}
          </Button>
        </div>
      </form>

      {/* Preview modal */}
      <ExercisePreviewModal
        exercise={previewExercise}
        open={!!previewExercise}
        onClose={() => setPreviewExercise(null)}
      />
    </Layout>
  );
}

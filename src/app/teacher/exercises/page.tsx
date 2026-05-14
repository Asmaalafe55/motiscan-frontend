"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exerciseLibraryService } from "@/services/exerciseLibrary.service";
import { examService } from "@/services/exam.service";
import { DifferencesExerciseBuilder } from "@/components/exercises/DifferencesExerciseBuilder";
import { ShapeCopyExerciseBuilder } from "@/components/exercises/ShapeCopyExerciseBuilder";
import { AnalyticalPerceptionBuilder } from "@/components/exercises/AnalyticalPerceptionBuilder";
import { ExercisePreviewModal } from "@/components/exercises/ExercisePreviewModal";
import { TypeSelectorModal } from "@/components/exercises/TypeSelectorModal";
import type { ExerciseTypeKey } from "@/components/exercises/exerciseTypeCatalog";
import type { Exercise } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Eye,
  ImageIcon,
  Pencil,
  PenLine,
  Plus,
  Search,
  Star,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Type meta — colour + icon per exercise type
// ---------------------------------------------------------------------------
const TYPE_META: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  differences: {
    label: "Differences",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <ImageIcon className="h-4 w-4 text-blue-500" />,
  },
  rating_scale: {
    label: "Rating Scale",
    badge: "bg-pink-100 text-pink-700 border-pink-200",
    icon: <Star className="h-4 w-4 text-pink-500" />,
  },
  multiple_choice: {
    label: "Multiple Choice",
    badge: "bg-sky-100 text-sky-700 border-sky-200",
    icon: <SlidersHorizontal className="h-4 w-4 text-sky-500" />,
  },
  likert_scale: {
    label: "Likert Scale",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    icon: <SlidersHorizontal className="h-4 w-4 text-purple-500" />,
  },
  shape_copy: {
    label: "Shape Copy",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    icon: <PenLine className="h-4 w-4 text-orange-500" />,
  },
  analytical_perception: {
    label: "Analytical Perception",
    badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: <SlidersHorizontal className="h-4 w-4 text-indigo-500" />,
  },
  similarity_ranking: {
    label: "Similarity Ranking",
    badge: "bg-green-100 text-green-700 border-green-200",
    icon: <SlidersHorizontal className="h-4 w-4 text-green-500" />,
  },
  priority_sort: {
    label: "Priority Sort",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    icon: <SlidersHorizontal className="h-4 w-4 text-purple-500" />,
  },
};

const ALL_FILTER = "all";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ExerciseLibraryPage() {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>(ALL_FILTER);

  // Modals
  const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderType, setBuilderType] = useState<ExerciseTypeKey | null>(null);
  const [editExercise, setEditExercise] = useState<Exercise | null>(null);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    const data = await exerciseLibraryService.getAllExercises();
    setExercises(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  // Unique types present in library
  const presentTypes = Array.from(new Set(exercises.map((e) => e.type)));

  const filtered = exercises.filter((ex) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      ex.title.toLowerCase().includes(q) ||
      ex.instructions.toLowerCase().includes(q) ||
      ex.tags.some((t) => t.toLowerCase().includes(q));
    const matchType = typeFilter === ALL_FILTER || ex.type === typeFilter;
    return matchSearch && matchType;
  });

  // ---- Type selector → builder ---
  const handleTypeSelected = (type: ExerciseTypeKey) => {
    setTypeSelectorOpen(false);
    setBuilderType(type);
    setEditExercise(null);
    setBuilderOpen(true);
  };

  // ---- Save (create or update) ----
  const handleSave = async (exercise: Omit<Exercise, "id">) => {
    if (editExercise) {
      await exerciseLibraryService.updateExercise(editExercise.id, exercise);
      toast({ title: "Exercise updated" });
    } else {
      await exerciseLibraryService.createExercise(
        exercise as Parameters<typeof exerciseLibraryService.createExercise>[0]
      );
      toast({ title: "Exercise saved", description: "Added to your exercise library." });
    }
    setBuilderOpen(false);
    setEditExercise(null);
    await fetchExercises();
  };

  // ---- Edit ----
  const handleEdit = (ex: Exercise) => {
    setEditExercise(ex);
    setBuilderType(ex.type as ExerciseTypeKey);
    setBuilderOpen(true);
  };

  // ---- Delete ----
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);

    // Check if exercise is in any live exam
    const allExams = await examService.getAllExams();
    const liveConflict = allExams.find(
      (exam) =>
        exam.isLive &&
        (exam.exerciseIds?.includes(deleteTarget.id) ||
          exam.questions.some((q) => q.id === deleteTarget.question.id))
    );
    if (liveConflict) {
      setDeleteError(
        `This exercise is part of an active exam session ("${liveConflict.title}"). End the session before deleting.`
      );
      setIsDeleting(false);
      return;
    }

    const result = await exerciseLibraryService.deleteExercise(deleteTarget.id);
    if (!result.ok) {
      setDeleteError(result.reason ?? "Could not delete exercise.");
      setIsDeleting(false);
      return;
    }

    toast({ title: "Exercise deleted" });
    setDeleteTarget(null);
    await fetchExercises();
    setIsDeleting(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Layout role="teacher">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Exercise Library</h1>
            <p className="text-sm text-muted-foreground">
              {exercises.length} exercise{exercises.length !== 1 ? "s" : ""} · reusable across exams
            </p>
          </div>
          <Button variant="gradient" onClick={() => setTypeSelectorOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Exercise
          </Button>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by title, tag, or keyword…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Type filter pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter(ALL_FILTER)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                typeFilter === ALL_FILTER
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-muted"
              }`}
            >
              All
            </button>
            {presentTypes.map((type) => {
              const meta = TYPE_META[type];
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type === typeFilter ? ALL_FILTER : type)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    typeFilter === type ? meta?.badge ?? "" : "bg-background border-border hover:bg-muted"
                  }`}
                >
                  {meta?.label ?? type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No exercises found</p>
            {search && (
              <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ex) => {
              const meta = TYPE_META[ex.type] ?? {
                label: ex.type,
                badge: "bg-gray-100 text-gray-700 border-gray-200",
                icon: <BookOpen className="h-4 w-4" />,
              };
              return (
                <Card
                  key={ex.id}
                  className="flex flex-col hover:shadow-md transition-shadow group"
                >
                  {/* Image thumbnail for differences type */}
                  {ex.type === "differences" && ex.question.differenceImages && (
                    <div className="grid grid-cols-2 gap-1 p-2.5 pb-0">
                      {[
                        ex.question.differenceImages.image1Url,
                        ex.question.differenceImages.image2Url,
                      ].map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={src}
                          alt={`Image ${i + 1}`}
                          className="w-full rounded border border-border object-contain bg-muted"
                          style={{ aspectRatio: "4/3", maxHeight: 80 }}
                          draggable={false}
                        />
                      ))}
                    </div>
                  )}

                  {/* Thumbnail for shape_copy type — show first row model */}
                  {ex.type === "shape_copy" && ex.question.shapeCopyConfig?.rows?.[0]?.model_snapshot && (
                    <div className="p-2.5 pb-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ex.question.shapeCopyConfig.rows[0].model_snapshot}
                        alt="Model shape"
                        className="w-full rounded border border-border object-contain bg-[#f8f8f8]"
                        style={{ aspectRatio: "4/3", maxHeight: 80 }}
                        draggable={false}
                      />
                    </div>
                  )}

                  {/* Thumbnail for analytical_perception — show first cell design SVG */}
                  {ex.type === "analytical_perception" && ex.question.analyticalPerceptionConfig?.cells?.[0]?.design_svg && (
                    <div className="grid grid-cols-2 gap-1 p-2.5 pb-0">
                      {ex.question.analyticalPerceptionConfig.cells.slice(0, 2).map((cell) => (
                        <div
                          key={cell.cell_label}
                          className="rounded border border-border bg-white overflow-hidden"
                          style={{ maxHeight: 80 }}
                          dangerouslySetInnerHTML={{ __html: cell.design_svg }}
                        />
                      ))}
                    </div>
                  )}

                  <CardHeader className="pb-2 pt-3">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{meta.icon}</div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">
                          {ex.title}
                        </CardTitle>
                        <div className="mt-1 flex flex-wrap gap-1 items-center">
                          <span
                            className={`text-[11px] font-medium rounded-full px-2 py-0.5 border ${meta.badge}`}
                          >
                            {meta.label}
                          </span>
                          {ex.createdAt && (
                            <span className="text-[11px] text-muted-foreground">
                              {format(new Date(ex.createdAt), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col justify-between pt-0 gap-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {ex.instructions}
                    </p>

                    {ex.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ex.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => setPreviewExercise(ex)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => handleEdit(ex)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
                        onClick={() => { setDeleteTarget(ex); setDeleteError(null); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Type selector modal ── */}
      <TypeSelectorModal
        open={typeSelectorOpen}
        onClose={() => setTypeSelectorOpen(false)}
        onSelect={handleTypeSelected}
      />

      {/* ── Builder modal (create / edit) ── */}
      <Dialog open={builderOpen} onOpenChange={(v) => { if (!v) { setBuilderOpen(false); setEditExercise(null); } }}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editExercise
                ? `Edit: ${editExercise.title}`
                : builderType === "shape_copy"
                ? "Create Shape Copy Exercise"
                : builderType === "analytical_perception"
                ? "Create Analytical Perception Exercise"
                : "Create Differences Exercise"}
            </DialogTitle>
          </DialogHeader>
          {builderType === "differences" && (
            <DifferencesExerciseBuilder
              initialData={
                editExercise
                  ? {
                      title: editExercise.title,
                      instructions: editExercise.instructions,
                      image1Url: editExercise.question.differenceImages?.image1Url,
                      image2Url: editExercise.question.differenceImages?.image2Url,
                      expectedAnswerNotes: editExercise.question.expectedAnswerNotes,
                      tags: editExercise.tags.join(", "),
                    }
                  : undefined
              }
              onSave={handleSave}
              onCancel={() => { setBuilderOpen(false); setEditExercise(null); }}
            />
          )}
          {builderType === "shape_copy" && (
            <ShapeCopyExerciseBuilder
              initialData={
                editExercise
                  ? {
                      title: editExercise.title,
                      instructions: editExercise.instructions,
                      tags: editExercise.tags.join(", "),
                    }
                  : undefined
              }
              onSave={handleSave}
              onCancel={() => { setBuilderOpen(false); setEditExercise(null); }}
            />
          )}
          {builderType === "analytical_perception" && (
            <AnalyticalPerceptionBuilder
              initialData={
                editExercise
                  ? {
                      title: editExercise.title,
                      instructions: editExercise.instructions,
                      tags: editExercise.tags.join(", "),
                    }
                  : undefined
              }
              onSave={handleSave}
              onCancel={() => { setBuilderOpen(false); setEditExercise(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Preview modal ── */}
      <ExercisePreviewModal
        exercise={previewExercise}
        open={!!previewExercise}
        onClose={() => setPreviewExercise(null)}
      />

      {/* ── Delete confirmation modal ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Exercise?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>&quot;{deleteTarget?.title}&quot;</strong>? This cannot be undone.
          </p>
          {deleteError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting || !!deleteError}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}


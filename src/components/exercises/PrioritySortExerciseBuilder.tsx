"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { PrioritySortExercise } from "./PrioritySortExercise";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Loader2, Plus, Trash2 } from "lucide-react";
import type { Exercise, PrioritySortTask, PrioritySortTracking } from "@/types";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  instructions: z.string().min(10, "Instructions must be at least 10 characters"),
  expectedAnswerNotes: z.string().optional(),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export interface PrioritySortBuilderInitialData {
  title?: string;
  instructions?: string;
  expectedAnswerNotes?: string;
  tags?: string;
  tasks?: PrioritySortTask[];
  /** When editing, keep stable question id for exams that reference it */
  questionId?: string;
  /** When editing, preserve library createdAt */
  createdAt?: string;
}

interface PrioritySortExerciseBuilderProps {
  initialData?: PrioritySortBuilderInitialData;
  onSave: (exercise: Omit<Exercise, "id">) => Promise<void>;
  onCancel?: () => void;
}

const DEFAULT_NEW_TASKS: PrioritySortTask[] = [
  { id: "task-1", title: "First priority item", icon: "📌" },
  { id: "task-2", title: "Second priority item", icon: "✅" },
  { id: "task-3", title: "Third priority item", icon: "⭐" },
  { id: "task-4", title: "Fourth priority item", icon: "💡" },
];

function makeTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function PrioritySortExerciseBuilder({
  initialData,
  onSave,
  onCancel,
}: PrioritySortExerciseBuilderProps) {
  const [tasks, setTasks] = useState<PrioritySortTask[]>(
    () =>
      initialData?.tasks?.length
        ? initialData.tasks.map((t) => ({ ...t }))
        : DEFAULT_NEW_TASKS.map((t) => ({ ...t }))
  );
  const [taskError, setTaskError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAnswer, setPreviewAnswer] = useState("");
  const [, setPreviewTracking] = useState<PrioritySortTracking | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title ?? "",
      instructions: initialData?.instructions ?? "",
      expectedAnswerNotes: initialData?.expectedAnswerNotes ?? "",
      tags: initialData?.tags ?? "",
    },
  });

  const watchedInstructions = watch("instructions");

  const addTask = () => {
    setTasks((prev) => [...prev, { id: makeTaskId(), title: "", icon: "📌" }]);
  };

  const removeTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, patch: Partial<PrioritySortTask>) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const onSubmit = async (data: FormData) => {
    const cleaned = tasks.map((t) => ({
      id: t.id.trim() || makeTaskId(),
      title: t.title.trim(),
      icon: (t.icon || "📌").trim(),
    }));

    if (cleaned.length < 2) {
      setTaskError("Add at least two tasks for students to rank.");
      return;
    }
    const empty = cleaned.find((t) => !t.title);
    if (empty) {
      setTaskError("Every task needs a title.");
      return;
    }
    setTaskError(null);

    setIsSaving(true);
    try {
      const rawTags = (data.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean);
      const tags =
        rawTags.length > 0 ? rawTags : ["motivation", "priorities", "self_reflection"];

      await onSave({
        title: data.title,
        type: "priority_sort",
        instructions: data.instructions,
        content: "",
        tags,
        createdAt: initialData?.createdAt ?? new Date().toISOString(),
        question: {
          id: initialData?.questionId ?? `priority-${Date.now()}-q`,
          examId: "",
          type: "priority_sort",
          text: data.instructions,
          required: true,
          order: 1,
          prioritySortData: { tasks: cleaned },
          expectedAnswerNotes: data.expectedAnswerNotes,
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="ps-title">Exercise Title</Label>
          <Input id="ps-title" placeholder="e.g. Order Your Tasks" {...register("title")} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ps-instructions">Instructions (shown to students)</Label>
          <Textarea
            id="ps-instructions"
            rows={3}
            placeholder="Explain that they should tap tasks in order of importance…"
            {...register("instructions")}
          />
          {errors.instructions && (
            <p className="text-xs text-destructive">{errors.instructions.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ps-notes">Expected answer notes (teacher only, optional)</Label>
          <Textarea
            id="ps-notes"
            rows={2}
            placeholder="Context for scoring or AI reports — e.g. there is no single correct order."
            {...register("expectedAnswerNotes")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ps-tags">Tags (comma-separated)</Label>
          <Input id="ps-tags" placeholder="motivation, priorities, school" {...register("tags")} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium leading-none">Tasks to rank</span>
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={addTask}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add task
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Each task has a short label and an emoji (or symbol) shown on the student card.
          </p>
          <div className="flex flex-col gap-2">
            {tasks.map((task, index) => (
              <Card key={task.id} className="border-border">
                <CardContent className="p-3 flex flex-wrap items-end gap-2 sm:flex-nowrap">
                  <div className="space-y-1 w-16 shrink-0">
                    <Label className="text-[10px] uppercase text-muted-foreground">Icon</Label>
                    <Input
                      value={task.icon}
                      onChange={(e) => updateTask(index, { icon: e.target.value })}
                      className="text-center text-lg px-1"
                      maxLength={8}
                      aria-label={`Task ${index + 1} icon`}
                    />
                  </div>
                  <div className="space-y-1 flex-1 min-w-[140px]">
                    <Label className="text-[10px] uppercase text-muted-foreground">Title</Label>
                    <Input
                      value={task.title}
                      onChange={(e) => updateTask(index, { title: e.target.value })}
                      placeholder={`Task ${index + 1}`}
                      aria-label={`Task ${index + 1} title`}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={tasks.length <= 2}
                    onClick={() => removeTask(index)}
                    aria-label={`Remove task ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {taskError && <p className="text-xs text-destructive">{taskError}</p>}
        </div>

        <div className="flex flex-wrap gap-2 justify-between pt-2 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" variant="gradient" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save exercise"
              )}
            </Button>
          </div>
        </div>
      </form>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <PrioritySortExercise
            instructions={watchedInstructions || " "}
            data={{ tasks }}
            value={previewAnswer}
            onChange={setPreviewAnswer}
            onTrackingUpdate={setPreviewTracking}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

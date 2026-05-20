"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DifferencesExercise } from "./DifferencesExercise";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  X,
  CheckCircle2,
} from "lucide-react";
import type { Exercise, DifferencesTracking, DifferenceObject } from "@/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Canonical set of change types available in the builder.
 * "Missing" has been removed — "Removed" covers the same idea more clearly.
 * Added  = object is new in Image 2 (absent from Image 1)
 * Removed = object existed in Image 1 but is gone in Image 2
 */
export const PRESET_CHANGE_TYPES = [
  "Color",
  "Size",
  "Shape",
  "Location",
  "Rotation",
  "Number",
  "Texture",
  "Pattern",
  "Added",
  "Removed",
];

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  instructions: z
    .string()
    .min(10, "Instructions must be at least 10 characters"),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DifferencesBuilderInitialData {
  title?: string;
  instructions?: string;
  image1Url?: string;
  image2Url?: string;
  tags?: string;
  differenceObjects?: DifferenceObject[];
}

interface DifferencesExerciseBuilderProps {
  initialData?: DifferencesBuilderInitialData;
  onSave: (exercise: Omit<Exercise, "id">) => Promise<void>;
  onCancel?: () => void;
}

// ---------------------------------------------------------------------------
// Image upload helper
// ---------------------------------------------------------------------------

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Small sub-component: section divider with label
// ---------------------------------------------------------------------------

function SectionHeader({
  step,
  title,
  subtitle,
}: {
  step: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-2 border-b border-border">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground mt-0.5">
        {step}
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground leading-none">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DifferencesExerciseBuilder({
  initialData,
  onSave,
  onCancel,
}: DifferencesExerciseBuilderProps) {
  const [image1, setImage1] = useState<string | null>(
    initialData?.image1Url ?? null
  );
  const [image2, setImage2] = useState<string | null>(
    initialData?.image2Url ?? null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [objectsError, setObjectsError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAnswer, setPreviewAnswer] = useState("{}");
  const [, setPreviewTracking] = useState<DifferencesTracking | null>(null);

  const [differenceObjects, setDifferenceObjects] = useState<DifferenceObject[]>(
    initialData?.differenceObjects ?? []
  );

  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);

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
      tags: initialData?.tags ?? "",
    },
  });

  // ---------------------------------------------------------------------------
  // Image handlers
  // ---------------------------------------------------------------------------

  const handleImageFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: 1 | 2
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Please upload a valid image file.");
      return;
    }
    setImageError(null);
    const dataUrl = await readFileAsDataURL(file);
    if (slot === 1) setImage1(dataUrl);
    else setImage2(dataUrl);
  };

  // ---------------------------------------------------------------------------
  // Difference-objects handlers
  // ---------------------------------------------------------------------------

  const addObject = () => {
    setDifferenceObjects((prev) => [
      ...prev,
      {
        id: `obj-${Date.now()}`,
        name: "",
        changeOptions: [...PRESET_CHANGE_TYPES],
        correctAnswers: [],
      },
    ]);
    setObjectsError(null);
  };

  const removeObject = (id: string) => {
    setDifferenceObjects((prev) => prev.filter((o) => o.id !== id));
  };

  const updateObjectName = (id: string, name: string) => {
    setDifferenceObjects((prev) =>
      prev.map((o) => (o.id === id ? { ...o, name } : o))
    );
  };

  const toggleChangeOption = (objectId: string, changeType: string) => {
    setDifferenceObjects((prev) =>
      prev.map((o) => {
        if (o.id !== objectId) return o;
        const has = o.changeOptions.includes(changeType);
        const newOptions = has
          ? o.changeOptions.filter((c) => c !== changeType)
          : [...o.changeOptions, changeType];
        const newCorrectAnswers = o.correctAnswers.filter((a) =>
          newOptions.includes(a)
        );
        return { ...o, changeOptions: newOptions, correctAnswers: newCorrectAnswers };
      })
    );
  };

  const toggleCorrectAnswer = (objectId: string, changeType: string) => {
    setDifferenceObjects((prev) =>
      prev.map((o) => {
        if (o.id !== objectId) return o;
        const has = o.correctAnswers.includes(changeType);
        return {
          ...o,
          correctAnswers: has
            ? o.correctAnswers.filter((a) => a !== changeType)
            : [...o.correctAnswers, changeType],
        };
      })
    );
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const onSubmit = async (data: FormData) => {
    if (!image1 || !image2) {
      setImageError("Please upload both images before saving.");
      return;
    }
    if (differenceObjects.length === 0) {
      setObjectsError("Add at least one object for students to classify.");
      return;
    }
    for (const obj of differenceObjects) {
      if (!obj.name.trim()) {
        setObjectsError("Every object must have a name.");
        return;
      }
      if (obj.changeOptions.length === 0) {
        setObjectsError(
          `Object "${obj.name || "unnamed"}" must have at least one change-type option.`
        );
        return;
      }
    }
    setObjectsError(null);
    setIsSaving(true);
    try {
      const rawTags = (data.tags ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const tags =
        rawTags.length > 0 ? rawTags : ["visual", "differences", "observation"];

      await onSave({
        title: data.title,
        type: "differences",
        instructions: data.instructions,
        content: "",
        tags,
        createdAt: new Date().toISOString(),
        question: {
          id: `diff-${Date.now()}-q`,
          examId: "",
          type: "differences",
          text: data.instructions,
          required: true,
          order: 1,
          differenceImages: { image1Url: image1, image2Url: image2 },
          differenceObjects,
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentInstructions =
    watch("instructions") || initialData?.instructions || "";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      {/* ── Step 1: Basic info ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionHeader
          step={1}
          title="Exercise Details"
          subtitle="Title, instructions and tags"
        />

        <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="diff-title">Title</Label>
            <Input
              id="diff-title"
              placeholder="e.g. Spot the Differences — Kitchen Scene"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-1.5 min-w-[180px]">
            <Label htmlFor="diff-tags">
              Tags{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (comma-separated)
              </span>
            </Label>
            <Input
              id="diff-tags"
              placeholder="visual, observation, grade-3"
              {...register("tags")}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-1.5">
          <Label htmlFor="diff-instructions">Instructions for students</Label>
          <Textarea
            id="diff-instructions"
            rows={2}
            placeholder="e.g. Look at the two images carefully. For each object below, select all the ways it changed — or leave it blank if it looks the same."
            {...register("instructions")}
          />
          {errors.instructions && (
            <p className="text-xs text-destructive">
              {errors.instructions.message}
            </p>
          )}
        </div>
      </div>

      {/* ── Step 2: Images ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionHeader
          step={2}
          title="Exercise Images"
          subtitle="Upload the two images students will compare side by side"
        />

        <div className="grid grid-cols-2 gap-4">
          {(
            [
              {
                slot: 1 as const,
                label: "Image 1",
                value: image1,
                ref: input1Ref,
                clear: () => { setImage1(null); if (input1Ref.current) input1Ref.current.value = ""; },
              },
              {
                slot: 2 as const,
                label: "Image 2",
                value: image2,
                ref: input2Ref,
                clear: () => { setImage2(null); if (input2Ref.current) input2Ref.current.value = ""; },
              },
            ] as const
          ).map(({ slot, label, value: imgVal, ref, clear }) => (
            <div key={slot} className="space-y-1.5">
              {/* Label styled like in the exercise view */}
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>

              {imgVal ? (
                /* Uploaded — show image exactly as it appears in the exercise,
                   with hover overlay to replace */
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgVal}
                    alt={label}
                    className="w-full rounded-lg border-2 border-border object-contain bg-muted"
                    style={{ aspectRatio: "4/3", maxHeight: 220 }}
                    draggable={false}
                  />
                  {/* Hover overlay: click to replace */}
                  <div
                    className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    onClick={() => ref.current?.click()}
                  >
                    <span className="text-white text-sm font-semibold flex items-center gap-1.5">
                      <ImagePlus className="h-4 w-4" />
                      Click to replace
                    </span>
                  </div>
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={clear}
                    className="absolute top-2 right-2 rounded-full bg-destructive p-1 text-white shadow hover:bg-destructive/80 transition-colors"
                    aria-label={`Remove ${label}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                /* Empty slot — styled upload zone matching the image aspect ratio */
                <div
                  className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary bg-muted/30 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground"
                  style={{ aspectRatio: "4/3", maxHeight: 220 }}
                  onClick={() => ref.current?.click()}
                >
                  <ImagePlus className="h-10 w-10 text-muted-foreground/40" />
                  <span className="text-sm font-medium">Click to upload</span>
                  <span className="text-xs text-muted-foreground/70">
                    PNG, JPG, WEBP, SVG
                  </span>
                </div>
              )}

              <input
                ref={ref}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageFile(e, slot)}
              />
            </div>
          ))}
        </div>

        {imageError && (
          <p className="text-xs text-destructive">{imageError}</p>
        )}
      </div>

      {/* ── Step 3: Objects ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionHeader
          step={3}
          title="Objects to Classify"
          subtitle="Add each visible object. Pick which change types students can choose, then mark the correct answer(s). Leave Correct Answers empty if the object is unchanged."
        />

        {differenceObjects.length === 0 && (
          <div className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
            No objects yet — click &ldquo;Add Object&rdquo; to get started.
          </div>
        )}

        <div className="space-y-3">
          {differenceObjects.map((obj, i) => (
            <div
              key={obj.id}
              className="rounded-xl border-2 border-border bg-card p-4 space-y-3 hover:border-blue-200 transition-colors"
            >
              {/* Row header with inline name input */}
              <div className="flex items-center gap-3">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <Input
                  value={obj.name}
                  onChange={(e) => updateObjectName(obj.id, e.target.value)}
                  placeholder="Object name (e.g. Sun)"
                  className="h-8 text-sm font-medium flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeObject(obj.id)}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  aria-label="Remove object"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                {/* Change-type options (what buttons students see) */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                    Show to student
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_CHANGE_TYPES.map((ct) => {
                      const active = obj.changeOptions.includes(ct);
                      return (
                        <button
                          key={ct}
                          type="button"
                          onClick={() => toggleChangeOption(obj.id, ct)}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                            active
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-background border-border text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {ct}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Correct answers */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Correct answer(s)
                    <span className="normal-case text-muted-foreground font-normal">
                      — empty = no change
                    </span>
                  </p>
                  {obj.changeOptions.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      Enable options on the left first.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {obj.changeOptions.map((ct) => {
                        const isCorrect = obj.correctAnswers.includes(ct);
                        return (
                          <button
                            key={ct}
                            type="button"
                            onClick={() => toggleCorrectAnswer(obj.id, ct)}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                              isCorrect
                                ? "bg-green-600 text-white border-green-600"
                                : "bg-background border-border text-foreground hover:bg-muted"
                            )}
                          >
                            {ct}
                          </button>
                        );
                      })}
                      {obj.correctAnswers.length === 0 && (
                        <span className="text-xs text-muted-foreground/70 italic">
                          unchanged
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addObject}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Object
        </Button>

        {objectsError && (
          <p className="text-xs text-destructive">{objectsError}</p>
        )}
      </div>

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button
          type="button"
          variant="outline"
          disabled={!image1 || !image2}
          onClick={() => {
            setPreviewAnswer("{}");
            setPreviewOpen(true);
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview as Student
        </Button>

        <div className="flex gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
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
              "Save to Library"
            )}
          </Button>
        </div>
      </div>

      {/* ── Preview Modal ──────────────────────────────────────────────── */}
      <Dialog
        open={previewOpen}
        onOpenChange={(v) => {
          if (!v) {
            setPreviewOpen(false);
            setPreviewAnswer("{}");
            setPreviewTracking(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <div className="flex items-center gap-2 rounded-lg border border-yellow-400 bg-yellow-50 px-4 py-2.5 text-sm font-medium text-yellow-800 mb-2">
            <Eye className="h-4 w-4 flex-shrink-0" />
            Preview Mode — your answers will not be saved
          </div>
          <DialogHeader>
            <DialogTitle className="text-base">Student Preview</DialogTitle>
          </DialogHeader>
          {image1 && image2 && (
            <DifferencesExercise
              instructions={currentInstructions}
              images={{ image1Url: image1, image2Url: image2 }}
              differenceObjects={differenceObjects}
              value={previewAnswer}
              onChange={setPreviewAnswer}
              onTrackingUpdate={setPreviewTracking}
            />
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}

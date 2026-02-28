"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlus, Loader2, X } from "lucide-react";
import type { Exercise } from "@/types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  instructions: z.string().min(10, "Instructions must be at least 10 characters"),
  expectedAnswerNotes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DifferencesExerciseBuilderProps {
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
// Component
// ---------------------------------------------------------------------------

export function DifferencesExerciseBuilder({
  onSave,
  onCancel,
}: DifferencesExerciseBuilderProps) {
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

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

  const onSubmit = async (data: FormData) => {
    if (!image1 || !image2) {
      setImageError("Please upload both images before saving.");
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        title: data.title,
        type: "differences",
        instructions: data.instructions,
        content: "",
        tags: ["visual", "differences", "observation"],
        question: {
          id: `diff-${Date.now()}-q`,
          examId: "",
          type: "differences",
          text: data.instructions,
          required: true,
          order: 1,
          differenceImages: { image1Url: image1, image2Url: image2 },
          expectedAnswerNotes: data.expectedAnswerNotes,
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="diff-title">Exercise Title</Label>
        <Input
          id="diff-title"
          placeholder="e.g. Spot the Differences — Kitchen Scene"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Instructions */}
      <div className="space-y-1.5">
        <Label htmlFor="diff-instructions">Instructions</Label>
        <Textarea
          id="diff-instructions"
          rows={3}
          placeholder="e.g. Look at the two images carefully. Write all the differences you can find between them."
          {...register("instructions")}
        />
        {errors.instructions && (
          <p className="text-xs text-destructive">{errors.instructions.message}</p>
        )}
      </div>

      {/* Image uploads */}
      <div className="grid grid-cols-2 gap-4">
        {(
          [
            { slot: 1 as const, label: "Image 1", value: image1, ref: input1Ref, clear: () => setImage1(null) },
            { slot: 2 as const, label: "Image 2", value: image2, ref: input2Ref, clear: () => setImage2(null) },
          ]
        ).map(({ slot, label, value: imgVal, ref, clear }) => (
          <div key={slot} className="space-y-1.5">
            <Label>{label}</Label>
            {imgVal ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgVal}
                  alt={label}
                  className="w-full rounded-lg border-2 border-border object-contain bg-muted"
                  style={{ aspectRatio: "4/3", maxHeight: 180 }}
                />
                <button
                  type="button"
                  onClick={clear}
                  className="absolute top-1.5 right-1.5 rounded-full bg-destructive p-1 text-white shadow hover:bg-destructive/80"
                  aria-label={`Remove ${label}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Card
                className="cursor-pointer border-2 border-dashed hover:border-primary transition-colors"
                onClick={() => ref.current?.click()}
              >
                <CardContent className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm">Click to upload</span>
                  <span className="text-xs">PNG, JPG, WEBP, SVG</span>
                </CardContent>
              </Card>
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

      {imageError && <p className="text-xs text-destructive">{imageError}</p>}

      {/* Expected answer notes (teacher-only) */}
      <div className="space-y-1.5">
        <Label htmlFor="diff-notes">
          Expected Answer Notes{" "}
          <span className="text-muted-foreground font-normal">(teacher only — used as AI context)</span>
        </Label>
        <Textarea
          id="diff-notes"
          rows={3}
          placeholder="Describe all the differences in both images so the AI can score the student's answer..."
          {...register("expectedAnswerNotes")}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
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
            "Save to Exercise Library"
          )}
        </Button>
      </div>
    </form>
  );
}

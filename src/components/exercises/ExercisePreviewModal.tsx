"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DifferencesExercise } from "./DifferencesExercise";
import { PrioritySortExercise } from "./PrioritySortExercise";
import type {
  Exercise,
  DifferencesTracking,
  PrioritySortTracking,
} from "@/types";
import { Eye } from "lucide-react";

interface ExercisePreviewModalProps {
  exercise: Exercise | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Renders an exercise exactly as the student would see it.
 * Teacher can fully interact with it (type in answer area, etc.)
 * but all state is discarded on close — nothing is stored.
 */
export function ExercisePreviewModal({ exercise, open, onClose }: ExercisePreviewModalProps) {
  // Ephemeral answer state — never saved anywhere
  const [previewAnswer, setPreviewAnswer] = useState("");
  const [, setDifferencesTracking] = useState<DifferencesTracking | null>(null);
  const [, setPrioritySortTracking] = useState<PrioritySortTracking | null>(null);

  // Clear state whenever the modal is opened or a different exercise is shown
  useEffect(() => {
    if (open) {
      setPreviewAnswer("");
      setDifferencesTracking(null);
      setPrioritySortTracking(null);
    }
  }, [open, exercise?.id]);

  if (!exercise) return null;

  const q = exercise.question;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        {/* Yellow preview banner */}
        <div className="flex items-center gap-2 rounded-lg border border-yellow-400 bg-yellow-50 px-4 py-2.5 text-sm font-medium text-yellow-800 mb-2">
          <Eye className="h-4 w-4 flex-shrink-0" />
          Preview Mode — your answers will not be saved
        </div>

        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {exercise.title}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          {q.type === "differences" && q.differenceImages && (
            <DifferencesExercise
              instructions={q.text}
              images={q.differenceImages}
              value={previewAnswer}
              onChange={setPreviewAnswer}
              onTrackingUpdate={setDifferencesTracking}
            />
          )}
          {q.type === "priority_sort" && q.prioritySortData && (
            <PrioritySortExercise
              instructions={q.text}
              data={q.prioritySortData}
              value={previewAnswer}
              onChange={setPreviewAnswer}
              onTrackingUpdate={setPrioritySortTracking}
            />
          )}
          {q.type !== "differences" && q.type !== "priority_sort" && (
            <p className="text-sm text-muted-foreground italic">
              Preview for <strong>{q.type.replace(/_/g, " ")}</strong> exercises is not yet available.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

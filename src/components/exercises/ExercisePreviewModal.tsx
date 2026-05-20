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
import { ShapeCopyExercise } from "./ShapeCopyExercise";
import { AnalyticalPerceptionExercise } from "./AnalyticalPerceptionExercise";
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
      // Use "{}" as initial value for differences (JSON-serialised selections map)
      setPreviewAnswer(exercise?.question.type === "differences" ? "{}" : "");
      setDifferencesTracking(null);
      setPrioritySortTracking(null);
    }
  }, [open, exercise?.id, exercise?.question.type]);

  if (!exercise) return null;

  const q = exercise.question;
  const hasRichPreview =
    (q.type === "differences" && !!q.differenceImages) ||
    (q.type === "priority_sort" && !!q.prioritySortData) ||
    (q.type === "shape_copy" && !!q.shapeCopyConfig) ||
    (q.type === "analytical_perception" && !!q.analyticalPerceptionConfig);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
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
              differenceObjects={q.differenceObjects ?? []}
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
          {q.type === "shape_copy" && q.shapeCopyConfig && (
            <ShapeCopyExercise
              instructions={q.text}
              config={q.shapeCopyConfig}
              onTrackingUpdate={() => {}}
            />
          )}
          {q.type === "analytical_perception" && q.analyticalPerceptionConfig && (
            <AnalyticalPerceptionExercise
              instructions={q.text}
              config={q.analyticalPerceptionConfig}
              onTrackingUpdate={() => {}}
            />
          )}
          {!hasRichPreview && (
            <p className="text-sm text-muted-foreground italic">
              Preview for <strong>{q.type.replace(/_/g, " ")}</strong> exercises is not yet available.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

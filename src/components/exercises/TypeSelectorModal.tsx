"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  COMING_SOON_EXERCISE_TYPES,
  OPEN_EXERCISE_TYPES,
  type ExerciseTypeKey,
} from "./exerciseTypeCatalog";
import { ExerciseTypeTile } from "./ExerciseTypeTile";

export type { ExerciseTypeKey } from "./exerciseTypeCatalog";

interface TypeSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: ExerciseTypeKey) => void;
}

/**
 * Shown only when the teacher clicks "Add New Exercise" (not on the library page).
 * Available types first, then locked types — same grid gap throughout, no section headings.
 */
export function TypeSelectorModal({ open, onClose, onSelect }: TypeSelectorModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Exercise</DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-3">
          <div
            className="grid grid-cols-2 gap-3"
            aria-label="Exercise types you can create"
          >
            {OPEN_EXERCISE_TYPES.map((t) => (
              <ExerciseTypeTile key={t.key} type={t} onSelect={onSelect} />
            ))}
          </div>
          <div
            className="grid grid-cols-2 gap-3"
            aria-label="Additional exercise types, not yet available"
          >
            {COMING_SOON_EXERCISE_TYPES.map((t) => (
              <ExerciseTypeTile key={t.key} type={t} />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

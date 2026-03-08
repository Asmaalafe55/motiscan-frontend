"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

// ---------------------------------------------------------------------------
// Exercise type catalogue
// ---------------------------------------------------------------------------

export type ExerciseTypeKey =
  | "differences"
  | "pattern_match"
  | "shape_copy"
  | "analytical_perception"
  | "similarity_ranking"
  | "open_text"
  | "rating_scale"
  | "free_drawing";

interface TypeInfo {
  key: ExerciseTypeKey;
  label: string;
  description: string;
  measures: string;
  colour: string;       // Tailwind bg + text
  iconEmoji: string;
  active: boolean;
}

const TYPES: TypeInfo[] = [
  {
    key: "differences",
    label: "Differences",
    description: "Student finds differences between 2 images",
    measures: "Attention, analytical engagement",
    colour: "border-blue-300 bg-blue-50",
    iconEmoji: "🔍",
    active: true,
  },
  {
    key: "pattern_match",
    label: "Pattern Match",
    description: "Student matches dot/shape patterns from a model",
    measures: "Cognitive persistence, attention",
    colour: "border-purple-300 bg-purple-50",
    iconEmoji: "🔵",
    active: false,
  },
  {
    key: "shape_copy",
    label: "Shape Copy",
    description: "Student copies a shape following specific rules",
    measures: "Rule compliance, effort, confidence",
    colour: "border-orange-300 bg-orange-50",
    iconEmoji: "✏️",
    active: true,
  },
  {
    key: "analytical_perception",
    label: "Analytical Perception",
    description: "Student counts how many times a section appears in a design",
    measures: "Analytical perception, attention to detail, visual decomposition",
    colour: "border-indigo-300 bg-indigo-50",
    iconEmoji: "🔢",
    active: true,
  },
  {
    key: "similarity_ranking",
    label: "Similarity Ranking",
    description: "Student ranks images by similarity to a sample",
    measures: "Analytical engagement, thoroughness",
    colour: "border-green-300 bg-green-50",
    iconEmoji: "📊",
    active: false,
  },
  {
    key: "open_text",
    label: "Open Text",
    description: "Student answers a reflective open question",
    measures: "Emotional state, self-expression depth",
    colour: "border-yellow-300 bg-yellow-50",
    iconEmoji: "📝",
    active: false,
  },
  {
    key: "rating_scale",
    label: "Rating Scale",
    description: "Student rates themselves on a 1–10 scale",
    measures: "Self-awareness, honesty indicators",
    colour: "border-pink-300 bg-pink-50",
    iconEmoji: "⭐",
    active: false,
  },
  {
    key: "free_drawing",
    label: "Free Drawing",
    description: "Student draws freely on a canvas",
    measures: "Creativity engagement, risk-taking",
    colour: "border-teal-300 bg-teal-50",
    iconEmoji: "🎨",
    active: false,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TypeSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: ExerciseTypeKey) => void;
}

export function TypeSelectorModal({ open, onClose, onSelect }: TypeSelectorModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose Exercise Type</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-2">
          {TYPES.map((t) => (
            <div
              key={t.key}
              className={`relative rounded-xl border-2 p-4 flex flex-col gap-2 transition-shadow ${t.colour} ${
                t.active ? "hover:shadow-md cursor-pointer" : "opacity-60 cursor-not-allowed"
              }`}
              onClick={() => t.active && onSelect(t.key)}
            >
              {/* Coming Soon badge */}
              {!t.active && (
                <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                  <Lock className="h-2.5 w-2.5" />
                  Coming Soon
                </span>
              )}

              <div className="text-2xl">{t.iconEmoji}</div>
              <div>
                <p className="font-semibold text-sm">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Measures: {t.measures}
              </p>

              {t.active && (
                <Button
                  size="sm"
                  variant="gradient"
                  className="mt-1 self-start"
                  onClick={(e) => { e.stopPropagation(); onSelect(t.key); }}
                >
                  Create
                </Button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

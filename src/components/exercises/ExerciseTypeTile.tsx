"use client";

import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import type { ExerciseTypeInfo, ExerciseTypeKey } from "./exerciseTypeCatalog";

interface ExerciseTypeTileProps {
  type: ExerciseTypeInfo;
  onSelect?: (key: ExerciseTypeKey) => void;
}

export function ExerciseTypeTile({ type: t, onSelect }: ExerciseTypeTileProps) {
  return (
    <div
      className={`relative rounded-xl border-2 p-4 flex flex-col gap-2 transition-shadow ${t.colour} ${
        t.active ? "hover:shadow-md cursor-pointer" : "opacity-60 cursor-not-allowed"
      }`}
      onClick={() => t.active && onSelect?.(t.key)}
    >
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
      <p className="text-[11px] text-muted-foreground">Measures: {t.measures}</p>

      {t.active && onSelect && (
        <Button
          size="sm"
          variant="gradient"
          className="mt-1 self-start"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(t.key);
          }}
        >
          Create
        </Button>
      )}
    </div>
  );
}

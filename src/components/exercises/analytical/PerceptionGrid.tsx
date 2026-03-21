"use client";

import { PerceptionCellComponent } from "./PerceptionCell";
import type { AnalyticalPerceptionConfig, PerceptionGridSize } from "@/types";

// ---------------------------------------------------------------------------
// Grid layout helpers
// ---------------------------------------------------------------------------

function gridDimensions(size: PerceptionGridSize): { rows: number; cols: number } {
  if (size === "2x3") return { rows: 2, cols: 3 };
  if (size === "2x4") return { rows: 2, cols: 4 };
  return { rows: 3, cols: 4 }; // 3x4
}

const ROW_LABELS = ["A", "B", "C"];

interface PerceptionGridProps {
  config: AnalyticalPerceptionConfig;
  /** answers[cellLabel] = selected number (null if not answered) */
  answers: Record<string, number | null>;
  onAnswerChange: (cellLabel: string, value: number) => void;
  onCellTimeUpdate?: (cellLabel: string, seconds: number) => void;
}

export function PerceptionGrid({
  config,
  answers,
  onAnswerChange,
  onCellTimeUpdate,
}: PerceptionGridProps) {
  const { rows, cols } = gridDimensions(config.grid_size);

  // Build a lookup: cellLabel → cell data
  const cellMap: Record<string, (typeof config.cells)[number]> = {};
  for (const cell of config.cells) {
    cellMap[cell.cell_label] = cell;
  }

  return (
    <div className="w-full overflow-x-auto">
      {/* Column header row */}
      <div
        className="grid mb-1"
        style={{ gridTemplateColumns: `2rem repeat(${cols}, minmax(0, 1fr))`, gap: "0.5rem" }}
      >
        {/* Empty top-left corner above row labels */}
        <div />
        {Array.from({ length: cols }, (_, c) => (
          <div
            key={c}
            className="flex items-center justify-center"
          >
            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 select-none">
              {c + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Data rows */}
      {Array.from({ length: rows }, (_, r) => (
        <div
          key={r}
          className="grid mb-3"
          style={{ gridTemplateColumns: `2rem repeat(${cols}, minmax(0, 1fr))`, gap: "0.5rem" }}
        >
          {/* Row label */}
          <div className="flex items-start justify-center pt-3">
            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 select-none">
              {ROW_LABELS[r]}
            </span>
          </div>

          {/* Cells in this row */}
          {Array.from({ length: cols }, (_, c) => {
            const label = `${ROW_LABELS[r]}${c + 1}`;
            const cell = cellMap[label];
            if (!cell) return <div key={label} />;
            return (
              <PerceptionCellComponent
                key={label}
                cellLabel={label}
                designSvg={cell.design_svg}
                sectionSvg={cell.section_svg}
                value={answers[label] ?? null}
                onChange={(val) => onAnswerChange(label, val)}
                onTimeUpdate={
                  onCellTimeUpdate
                    ? (s) => onCellTimeUpdate(label, s)
                    : undefined
                }
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

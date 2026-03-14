"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnalyticalPerceptionExercise } from "./AnalyticalPerceptionExercise";
import { Eye, Loader2, Plus, Trash2, Upload } from "lucide-react";
import type {
  Exercise,
  AnalyticalPerceptionConfig,
  PerceptionCell,
  PerceptionGridSize,
} from "@/types";

// ---------------------------------------------------------------------------
// Grid size helpers
// ---------------------------------------------------------------------------

const GRID_SIZES: { value: PerceptionGridSize; label: string; count: number }[] = [
  { value: "2x3", label: "2 rows × 3 cols (6 items)", count: 6 },
  { value: "2x4", label: "2 rows × 4 cols (8 items)", count: 8 },
  { value: "3x4", label: "3 rows × 4 cols (12 items)", count: 12 },
];

const ROW_LABELS = ["A", "B", "C"];

function getCellLabels(size: PerceptionGridSize): string[] {
  const { rows, cols } =
    size === "2x3" ? { rows: 2, cols: 3 }
    : size === "2x4" ? { rows: 2, cols: 4 }
    : { rows: 3, cols: 4 };
  const labels: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      labels.push(`${ROW_LABELS[r]}${c + 1}`);
    }
  }
  return labels;
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

// Wrap a data URL image in an SVG for uniform rendering
function imageToSvgString(dataUrl: string, w = 120, h = 120): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><image href="${dataUrl}" width="${w}" height="${h}"/></svg>`;
}

// ---------------------------------------------------------------------------
// Per-cell draft
// ---------------------------------------------------------------------------

interface CellDraft {
  cell_label: string;
  design_svg: string;
  section_svg: string;
  correct_answer: number;
  teacher_notes: string;
}

function makeEmptyCell(label: string): CellDraft {
  return { cell_label: label, design_svg: "", section_svg: "", correct_answer: 1, teacher_notes: "" };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AnalyticalPerceptionBuilderProps {
  initialData?: Partial<{
    title: string;
    instructions: string;
    tags: string;
    grid_size: PerceptionGridSize;
  }>;
  onSave: (exercise: Omit<Exercise, "id">) => Promise<void>;
  onCancel?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnalyticalPerceptionBuilder({
  initialData,
  onSave,
  onCancel,
}: AnalyticalPerceptionBuilderProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [instructions, setInstructions] = useState(
    initialData?.instructions ??
      "On each line write the number of times that the section next to it appears in the design."
  );
  const [tags, setTags] = useState(initialData?.tags ?? "analytical, perception, visual");
  const [gridSize, setGridSize] = useState<PerceptionGridSize>(initialData?.grid_size ?? "2x4");
  const [cells, setCells] = useState<CellDraft[]>(() =>
    getCellLabels(initialData?.grid_size ?? "2x4").map(makeEmptyCell)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeCell, setActiveCell] = useState<string | null>(null);

  // Rebuild cells when grid size changes (preserves existing cell data)
  const handleGridSizeChange = (size: PerceptionGridSize) => {
    setGridSize(size);
    const newLabels = getCellLabels(size);
    setCells((prev) => {
      const prevMap: Record<string, CellDraft> = {};
      for (const c of prev) prevMap[c.cell_label] = c;
      return newLabels.map((l) => prevMap[l] ?? makeEmptyCell(l));
    });
  };

  // ---------------------------------------------------------------------------
  // Cell update helpers
  // ---------------------------------------------------------------------------

  const updateCell = (label: string, patch: Partial<CellDraft>) => {
    setCells((prev) => prev.map((c) => (c.cell_label === label ? { ...c, ...patch } : c)));
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    cellLabel: string,
    slot: "design" | "section"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataURL(file);
    const svgStr = imageToSvgString(dataUrl, slot === "design" ? 120 : 40, slot === "design" ? 120 : 40);
    updateCell(cellLabel, slot === "design" ? { design_svg: svgStr } : { section_svg: svgStr });
  };

  // ---------------------------------------------------------------------------
  // Validation & save
  // ---------------------------------------------------------------------------

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!title.trim() || title.length < 3) errs.push("Title must be at least 3 characters.");
    if (!instructions.trim() || instructions.length < 10) errs.push("Instructions too short.");
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setIsSaving(true);
    try {
      const perceptionCells: PerceptionCell[] = cells.map((c) => ({
        cell_label: c.cell_label,
        design_svg: c.design_svg,
        section_svg: c.section_svg,
        correct_answer: c.correct_answer,
        teacher_notes: c.teacher_notes || undefined,
      }));

      const config: AnalyticalPerceptionConfig = {
        grid_size: gridSize,
        cells: perceptionCells,
      };

      const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);

      await onSave({
        title: title.trim(),
        type: "analytical_perception",
        instructions: instructions.trim(),
        content: "",
        tags: parsedTags.length > 0 ? parsedTags : ["analytical", "perception"],
        createdAt: new Date().toISOString(),
        question: {
          id: `ap-${Date.now()}-q`,
          examId: "",
          type: "analytical_perception",
          text: instructions.trim(),
          required: true,
          order: 1,
          analyticalPerceptionConfig: config,
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Preview config
  // ---------------------------------------------------------------------------

  const buildPreviewConfig = useCallback((): AnalyticalPerceptionConfig => ({
    grid_size: gridSize,
    cells: cells.map((c) => ({
      cell_label: c.cell_label,
      design_svg: c.design_svg || `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect x="10" y="10" width="100" height="100" fill="none" stroke="#ccc" stroke-width="2"/><text x="60" y="65" text-anchor="middle" fill="#ccc" font-size="12">${c.cell_label}</text></svg>`,
      section_svg: c.section_svg || `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="12" fill="none" stroke="#4F46E5" stroke-width="2"/></svg>`,
      correct_answer: c.correct_answer,
      teacher_notes: c.teacher_notes || undefined,
    })),
  }), [gridSize, cells]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5">
        <Label>Exercise Title</Label>
        <Input
          placeholder="e.g. Shape Recognition — Basic"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Instructions */}
      <div className="space-y-1.5">
        <Label>Instructions <span className="text-muted-foreground font-normal">(shown to student)</span></Label>
        <Textarea rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <Label>Tags <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
        <Input value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>

      {/* Grid size */}
      <div className="space-y-1.5">
        <Label>Grid Size</Label>
        <div className="flex flex-wrap gap-2">
          {GRID_SIZES.map((gs) => (
            <button
              key={gs.value}
              type="button"
              onClick={() => handleGridSizeChange(gs.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                gridSize === gs.value
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {gs.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cell editors */}
      <div className="space-y-3">
        <Label>Cells ({cells.length})</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cells.map((cell) => (
            <div
              key={cell.cell_label}
              className={`rounded-xl border-2 p-3 space-y-2 cursor-pointer transition-colors ${
                activeCell === cell.cell_label ? "border-indigo-400 bg-indigo-50/30" : "border-border hover:border-indigo-200"
              }`}
              onClick={() => setActiveCell(cell.cell_label)}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600">{cell.cell_label}</span>
              </div>

              {/* Design preview */}
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Design</p>
                {cell.design_svg ? (
                  <div
                    className="w-full rounded border border-gray-100 bg-gray-50"
                    style={{ height: 80 }}
                    dangerouslySetInnerHTML={{ __html: cell.design_svg }}
                  />
                ) : (
                  <label className="flex flex-col items-center justify-center rounded border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:border-indigo-300 transition-colors" style={{ height: 80 }}>
                    <Upload className="h-4 w-4 text-gray-300 mb-1" />
                    <span className="text-[10px] text-gray-400">Upload design</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, cell.cell_label, "design")} />
                  </label>
                )}
              </div>

              {/* Section preview */}
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Section Shape</p>
                {cell.section_svg ? (
                  <div
                    className="w-10 h-10 rounded border border-gray-100"
                    dangerouslySetInnerHTML={{ __html: cell.section_svg }}
                  />
                ) : (
                  <label className="flex items-center justify-center w-10 h-10 rounded border-2 border-dashed border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors">
                    <Upload className="h-3 w-3 text-gray-300" />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, cell.cell_label, "section")} />
                  </label>
                )}
              </div>

              {/* Correct answer */}
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide flex-shrink-0">Answer key</p>
                <select
                  value={cell.correct_answer}
                  onChange={(e) => updateCell(cell.cell_label, { correct_answer: Number(e.target.value) })}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 rounded border border-gray-200 text-xs px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Teacher notes */}
              <div>
                <textarea
                  rows={1}
                  placeholder="Teacher notes…"
                  value={cell.teacher_notes}
                  onChange={(e) => updateCell(cell.cell_label, { teacher_notes: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-[11px] rounded border border-gray-200 px-1.5 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 space-y-1">
          {errors.map((err, i) => <p key={i} className="text-sm text-destructive">{err}</p>)}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>
          <Eye className="h-4 w-4 mr-2" />
          Preview as Student
        </Button>
        <div className="flex gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
          )}
          <Button type="button" variant="gradient" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save to Library"}
          </Button>
        </div>
      </div>

      {/* Preview modal */}
      <Dialog open={previewOpen} onOpenChange={(v) => { if (!v) setPreviewOpen(false); }}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <div className="flex items-center gap-2 rounded-lg border border-yellow-400 bg-yellow-50 px-4 py-2.5 text-sm font-medium text-yellow-800 mb-2">
            <Eye className="h-4 w-4 flex-shrink-0" />
            Preview Mode — your answers will not be saved
          </div>
          <DialogHeader>
            <DialogTitle className="text-base">Student Preview</DialogTitle>
          </DialogHeader>
          <AnalyticalPerceptionExercise
            instructions={instructions}
            config={buildPreviewConfig()}
            onTrackingUpdate={() => {}}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

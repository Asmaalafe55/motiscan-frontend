"use client";

import { useCallback, useRef, useState } from "react";
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
import { ShapeCanvas, ShapeCanvasHandle } from "./canvas/ShapeCanvas";
import { DrawingToolbar } from "./canvas/Toolbar";
import type { ToolType } from "./canvas/ShapeCanvas";
import { ShapeCopyExercise } from "./ShapeCopyExercise";
import { Eye, Loader2, Plus, Trash2 } from "lucide-react";
import type { Exercise, ShapeCopyRow, ShapeCopyRule, ShapeCopyConfig } from "@/types";
import { toImageSrc } from "@/lib/svg";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RuleState = { rule: ShapeCopyRule; required: boolean };

interface RowDraft {
  figureARules: RuleState[];
  figureBRules: RuleState[];
  teacherNotes: string;
  modelSnapshot: string;
}

const ALL_RULES: ShapeCopyRule[] = ["shape", "size", "color", "number"];

function defaultRules(): RuleState[] {
  return ALL_RULES.map((r) => ({ rule: r, required: false }));
}

function makeEmptyRow(): RowDraft {
  return {
    figureARules: defaultRules(),
    figureBRules: defaultRules(),
    teacherNotes: "",
    modelSnapshot: "",
  };
}

// ---------------------------------------------------------------------------
// Rule checkbox group
// ---------------------------------------------------------------------------

interface RuleCheckboxGroupProps {
  label: string;
  rules: RuleState[];
  onChange: (updated: RuleState[]) => void;
}

function RuleCheckboxGroup({ label, rules, onChange }: RuleCheckboxGroupProps) {
  const toggle = (rule: ShapeCopyRule) => {
    onChange(rules.map((r) => (r.rule === rule ? { ...r, required: !r.required } : r)));
  };
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-2">
        {rules.map(({ rule, required }) => (
          <label
            key={rule}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium cursor-pointer border transition-colors select-none ${
              required
                ? "bg-blue-100 text-blue-700 border-blue-400"
                : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={required}
              onChange={() => toggle(rule)}
            />
            <span className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center ${required ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
              {required && <span className="text-white text-[8px] leading-none">✓</span>}
            </span>
            {rule.charAt(0).toUpperCase() + rule.slice(1)}
          </label>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ShapeCopyExerciseBuilderProps {
  initialData?: Partial<{
    title: string;
    instructions: string;
    tags: string;
    rows: RowDraft[];
  }>;
  onSave: (exercise: Omit<Exercise, "id">) => Promise<void>;
  onCancel?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShapeCopyExerciseBuilder({
  initialData,
  onSave,
  onCancel,
}: ShapeCopyExerciseBuilderProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [instructions, setInstructions] = useState(
    initialData?.instructions ??
      "Look at the sample picture. In each of the two frames in the same row make a drawing that is the same as the sample only in those aspects indicated by the blue words."
  );
  const [tags, setTags] = useState(initialData?.tags ?? "drawing, shape-copy");
  const [rows, setRows] = useState<RowDraft[]>(initialData?.rows ?? [makeEmptyRow()]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Toolbar state for the builder
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [fillColor, setFillColor] = useState("#3b82f6");
  const [borderColor, setBorderColor] = useState("#1a1a1a");
  const [activeModelRow, setActiveModelRow] = useState<number>(0);

  // Model canvas refs indexed by row
  const modelRefs = useRef<Record<number, React.RefObject<ShapeCanvasHandle | null>>>({});
  rows.forEach((_, i) => {
    if (!modelRefs.current[i]) {
      modelRefs.current[i] = { current: null } as React.RefObject<ShapeCanvasHandle | null>;
    }
  });

  // Capture model snapshots from canvases
  const captureSnapshots = useCallback((): string[] => {
    return rows.map((_, i) => {
      const canvas = modelRefs.current[i]?.current;
      return canvas?.getSnapshot() ?? rows[i].modelSnapshot;
    });
  }, [rows]);

  // ---------------------------------------------------------------------------
  // Toolbar actions on active model canvas
  // ---------------------------------------------------------------------------

  const getActiveModel = useCallback(() => {
    return modelRefs.current[activeModelRow]?.current ?? null;
  }, [activeModelRow]);

  const handleUndo = () => { getActiveModel()?.undo(); };
  const handleRedo = () => { getActiveModel()?.redo(); };
  const handleDelete = () => { getActiveModel()?.deleteSelected(); };
  const handleDuplicate = () => { getActiveModel()?.duplicateSelected(); };
  const handleFillColor = (color: string) => {
    setFillColor(color);
    getActiveModel()?.setFillColor(color);
  };
  const handleBorderColor = (color: string) => {
    setBorderColor(color);
    getActiveModel()?.setBorderColor(color);
  };

  // ---------------------------------------------------------------------------
  // Row management
  // ---------------------------------------------------------------------------

  const addRow = () => {
    if (rows.length >= 10) return;
    setRows((prev) => [...prev, makeEmptyRow()]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRowRules = (
    rowIndex: number,
    figure: "A" | "B",
    updated: RuleState[]
  ) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i !== rowIndex
          ? r
          : figure === "A"
          ? { ...r, figureARules: updated }
          : { ...r, figureBRules: updated }
      )
    );
  };

  const updateRowNotes = (rowIndex: number, notes: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i !== rowIndex ? r : { ...r, teacherNotes: notes }))
    );
  };

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const validate = () => {
    const errs: string[] = [];
    if (!title.trim() || title.trim().length < 3) errs.push("Title must be at least 3 characters.");
    if (!instructions.trim() || instructions.trim().length < 10) errs.push("Instructions must be at least 10 characters.");
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setIsSaving(true);

    try {
      const snapshots = captureSnapshots();
      const shapeCopyRows: ShapeCopyRow[] = rows.map((r, i) => ({
        row_number: i + 1,
        model_snapshot: snapshots[i] ?? "",
        figureA_rules: r.figureARules,
        figureB_rules: r.figureBRules,
        teacher_notes: r.teacherNotes || undefined,
      }));

      const config: ShapeCopyConfig = { rows: shapeCopyRows };
      const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);

      await onSave({
        title: title.trim(),
        type: "shape_copy",
        instructions: instructions.trim(),
        content: "",
        tags: parsedTags.length > 0 ? parsedTags : ["drawing", "shape-copy"],
        createdAt: new Date().toISOString(),
        question: {
          id: `sc-${Date.now()}-q`,
          examId: "",
          type: "shape_copy",
          text: instructions.trim(),
          required: true,
          order: 1,
          shapeCopyConfig: config,
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Preview config
  // ---------------------------------------------------------------------------

  const buildPreviewConfig = useCallback((): ShapeCopyConfig => {
    const snapshots = captureSnapshots();
    return {
      rows: rows.map((r, i) => ({
        row_number: i + 1,
        model_snapshot: snapshots[i] ?? "",
        figureA_rules: r.figureARules,
        figureB_rules: r.figureBRules,
      })),
    };
  }, [rows, captureSnapshots]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5">
        <Label>Exercise Title</Label>
        <Input
          placeholder="e.g. Copy the Shape — Basic"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Instructions */}
      <div className="space-y-1.5">
        <Label>Instructions <span className="text-muted-foreground font-normal">(shown to student)</span></Label>
        <Textarea
          rows={3}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <Label>Tags <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
        <Input
          placeholder="e.g. drawing, shape-copy, visual"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      {/* Toolbar for model canvases */}
      <div className="space-y-1.5">
        <Label>Drawing Toolbar <span className="text-muted-foreground font-normal">(for model shapes)</span></Label>
        <DrawingToolbar
          activeTool={activeTool}
          fillColor={fillColor}
          borderColor={borderColor}
          onToolChange={setActiveTool}
          onFillColorChange={handleFillColor}
          onBorderColorChange={handleBorderColor}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          hasSelection={false}
        />
      </div>

      {/* Rows */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Label>Rows ({rows.length}/10)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={rows.length >= 10}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Row
          </Button>
        </div>

        {rows.map((row, i) => (
          <div
            key={i}
            className={`rounded-xl border-2 p-4 space-y-4 transition-colors ${
              activeModelRow === i ? "border-blue-400 bg-blue-50/30" : "border-border"
            }`}
            onClick={() => setActiveModelRow(i)}
          >
            {/* Row header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Row {i + 1}</span>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeRow(i); }}
                  className="text-destructive hover:text-destructive/80 transition-colors"
                  title="Remove row"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Model canvas */}
            <div className="space-y-1.5">
              <Label>Model Shape <span className="text-muted-foreground font-normal">(draw the reference)</span></Label>
              {/* When editing, show the saved snapshot so the teacher can see the current model.
                  The canvas starts blank; drawing replaces the snapshot on save.
                  Leaving the canvas blank preserves the existing snapshot automatically. */}
              {row.modelSnapshot && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={toImageSrc(row.modelSnapshot)}
                    alt="Current model shape"
                    className="h-16 w-16 flex-shrink-0 rounded border border-amber-200 bg-white object-contain"
                    draggable={false}
                  />
                  <span className="mt-1">
                    <strong>Current saved model</strong> — the canvas below starts blank.
                    Draw here to replace this shape, or leave it blank to keep the existing one.
                  </span>
                </div>
              )}
              <ShapeCanvas
                ref={modelRefs.current[i] as React.RefObject<ShapeCanvasHandle | null>}
                readOnly={false}
                isActive={activeModelRow === i}
                activeTool={activeModelRow === i ? activeTool : "select"}
                fillColor={fillColor}
                borderColor={borderColor}
              />
            </div>

            {/* Rules */}
            <div className="grid grid-cols-2 gap-4">
              <RuleCheckboxGroup
                label="Figure A — Required Rules"
                rules={row.figureARules}
                onChange={(updated) => updateRowRules(i, "A", updated)}
              />
              <RuleCheckboxGroup
                label="Figure B — Required Rules"
                rules={row.figureBRules}
                onChange={(updated) => updateRowRules(i, "B", updated)}
              />
            </div>

            {/* Teacher notes */}
            <div className="space-y-1.5">
              <Label>
                Teacher Notes{" "}
                <span className="text-muted-foreground font-normal">(hidden from student, AI context)</span>
              </Label>
              <Textarea
                rows={2}
                placeholder="Describe what the model contains and what you expect the student to replicate..."
                value={row.teacherNotes}
                onChange={(e) => updateRowNotes(i, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-destructive">{err}</p>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setPreviewOpen(true)}
        >
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
          <ShapeCopyExercise
            instructions={instructions}
            config={buildPreviewConfig()}
            onTrackingUpdate={() => {}}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

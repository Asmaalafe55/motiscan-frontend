"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ShapeCopyConfig, ShapeCopyRule, ShapeCopyTracking, ShapeCopyFigureTracking } from "@/types";
import { ShapeCanvas, ShapeCanvasHandle } from "./canvas/ShapeCanvas";
import { DrawingToolbar } from "./canvas/Toolbar";
import type { ToolType } from "./canvas/ShapeCanvas";

interface ShapeCopyExerciseProps {
  /** Instructions text displayed above the exercise */
  instructions: string;
  /** Exercise config with rows (model + rules per figure) */
  config: ShapeCopyConfig;
  /** Called whenever tracking data changes — same pattern as DifferencesExercise */
  onTrackingUpdate: (tracking: ShapeCopyTracking) => void;
}

// ---------------------------------------------------------------------------
// Rule label component
// ---------------------------------------------------------------------------

interface RuleLabelsProps {
  rules: { rule: ShapeCopyRule; required: boolean }[];
}

function RuleLabels({ rules }: RuleLabelsProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-2 justify-center">
      {rules.map(({ rule, required }) => (
        <span
          key={rule}
          className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full border ${
            required
              ? "bg-blue-50 text-blue-700 border-blue-300"
              : "bg-gray-50 text-gray-400 border-gray-200"
          }`}
        >
          {rule}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RowSection — one row of model + figure A + figure B
// ---------------------------------------------------------------------------

interface RowSectionProps {
  rowIndex: number;
  rowNumber: number;
  modelSnapshot: string;
  figureARules: { rule: ShapeCopyRule; required: boolean }[];
  figureBRules: { rule: ShapeCopyRule; required: boolean }[];
  activeFigure: string | null;
  onFigureActivate: (key: string) => void;
  figureARef: React.RefObject<ShapeCanvasHandle | null>;
  figureBRef: React.RefObject<ShapeCanvasHandle | null>;
  activeTool: ToolType;
  fillColor: string;
  borderColor: string;
  onFirstShapeDrawn: (rowIndex: number, figure: "A" | "B") => void;
}

function RowSection({
  rowIndex,
  rowNumber,
  modelSnapshot,
  figureARules,
  figureBRules,
  activeFigure,
  onFigureActivate,
  figureARef,
  figureBRef,
  activeTool,
  fillColor,
  borderColor,
  onFirstShapeDrawn,
}: RowSectionProps) {
  const keyA = `${rowIndex}-A`;
  const keyB = `${rowIndex}-B`;

  return (
    <div className="flex items-start gap-2">
      {/* Row number badge */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground mt-2 select-none">
        {rowNumber}
      </div>

      {/* 3-column grid */}
      <div className="flex-1 grid grid-cols-3 gap-4">
        {/* MODEL */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-center text-muted-foreground uppercase tracking-wide">
            Model
          </span>
          <ShapeCanvas
            ref={null}
            readOnly
            modelSnapshot={modelSnapshot || undefined}
            isActive={false}
            activeTool="select"
            fillColor="#3b82f6"
            borderColor="#1a1a1a"
          />
        </div>

        {/* FIGURE A */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-center text-blue-600 uppercase tracking-wide">
            Figure A
          </span>
          <div onClick={() => onFigureActivate(keyA)}>
            <ShapeCanvas
              ref={figureARef}
              readOnly={false}
              isActive={activeFigure === keyA}
              activeTool={activeFigure === keyA ? activeTool : "select"}
              fillColor={fillColor}
              borderColor={borderColor}
              onFirstShapeDrawn={() => onFirstShapeDrawn(rowIndex, "A")}
            />
          </div>
          <RuleLabels rules={figureARules} />
        </div>

        {/* FIGURE B */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-center text-blue-600 uppercase tracking-wide">
            Figure B
          </span>
          <div onClick={() => onFigureActivate(keyB)}>
            <ShapeCanvas
              ref={figureBRef}
              readOnly={false}
              isActive={activeFigure === keyB}
              activeTool={activeFigure === keyB ? activeTool : "select"}
              fillColor={fillColor}
              borderColor={borderColor}
              onFirstShapeDrawn={() => onFirstShapeDrawn(rowIndex, "B")}
            />
          </div>
          <RuleLabels rules={figureBRules} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ShapeCopyExercise({
  instructions,
  config,
  onTrackingUpdate,
}: ShapeCopyExerciseProps) {
  const rows = config.rows;

  // Toolbar state — shared across all canvases; the active canvas receives commands
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [fillColor, setFillColor] = useState("#3b82f6");
  const [borderColor, setBorderColor] = useState("#1a1a1a");

  // Which figure is currently active (format: "{rowIndex}-{A|B}")
  const [activeFigure, setActiveFigure] = useState<string | null>(null);

  // Canvas refs indexed by "rowIndex-A" and "rowIndex-B"
  const canvasRefs = useRef<Record<string, React.RefObject<ShapeCanvasHandle | null>>>({});

  // Time tracking per figure
  const figureTimestamps = useRef<Record<string, { started: string; firstShape?: string }>>({});

  // Pre-create refs for all rows
  rows.forEach((_, i) => {
    ["A", "B"].forEach((fig) => {
      const key = `${i}-${fig}`;
      if (!canvasRefs.current[key]) {
        canvasRefs.current[key] = { current: null } as React.RefObject<ShapeCanvasHandle | null>;
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Tracking helpers
  // ---------------------------------------------------------------------------

  const buildTracking = useCallback((): ShapeCopyTracking => {
    const figures: ShapeCopyFigureTracking[] = [];

    rows.forEach((row, i) => {
      (["A", "B"] as const).forEach((fig) => {
        const key = `${i}-${fig}`;
        const canvasRef = canvasRefs.current[key];
        const canvas = canvasRef?.current;
        const ts = figureTimestamps.current[key];
        const rules = fig === "A" ? row.figureA_rules : row.figureB_rules;
        const requiredRules = rules.filter((r) => r.required).map((r) => r.rule);

        const stats = canvas?.getStats() ?? {
          totalShapesDrawn: 0,
          shapesDeleted: 0,
          shapesMoved: 0,
          undoCount: 0,
          redoCount: 0,
        };

        const started = ts?.started ?? new Date().toISOString();
        const startedMs = new Date(started).getTime();
        const timeSpent = Math.floor((Date.now() - startedMs) / 1000);

        figures.push({
          row_number: row.row_number,
          figure: fig,
          canvas_snapshot: canvas?.getSnapshot() ?? "",
          shapes_data: canvas?.getShapesData() ?? [],
          time_started: started,
          time_first_shape_drawn: ts?.firstShape,
          total_shapes_drawn: stats.totalShapesDrawn,
          shapes_deleted: stats.shapesDeleted,
          shapes_moved: stats.shapesMoved,
          undo_count: stats.undoCount,
          redo_count: stats.redoCount,
          time_spent_seconds: timeSpent,
          required_rules: requiredRules,
        });
      });
    });

    return { figures };
  }, [rows]);

  // ---------------------------------------------------------------------------
  // Tracking update — uses the same isFirstRender + prevTrackingRef pattern
  // from DifferencesExercise to prevent infinite loops
  // ---------------------------------------------------------------------------

  const isFirstRender = useRef(true);
  const prevTrackingRef = useRef<ShapeCopyTracking | null>(null);
  const [trackingVersion, setTrackingVersion] = useState(0);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const tracking = buildTracking();
    if (prevTrackingRef.current !== tracking) {
      prevTrackingRef.current = tracking;
      onTrackingUpdate(tracking);
    }
    // onTrackingUpdate is intentionally excluded to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingVersion]);

  const notifyTracking = useCallback(() => {
    setTrackingVersion((v) => v + 1);
  }, []);

  // ---------------------------------------------------------------------------
  // Figure activation
  // ---------------------------------------------------------------------------

  const handleFigureActivate = useCallback((key: string) => {
    setActiveFigure(key);
    const [rowIdx, fig] = key.split("-") as [string, string];
    const ts = figureTimestamps.current[key];
    if (!ts) {
      figureTimestamps.current[key] = { started: new Date().toISOString() };
    }
    void rowIdx; void fig;
  }, []);

  // ---------------------------------------------------------------------------
  // First shape drawn per figure
  // ---------------------------------------------------------------------------

  const handleFirstShapeDrawn = useCallback((rowIndex: number, figure: "A" | "B") => {
    const key = `${rowIndex}-${figure}`;
    if (!figureTimestamps.current[key]) {
      figureTimestamps.current[key] = { started: new Date().toISOString() };
    }
    figureTimestamps.current[key].firstShape = new Date().toISOString();
    notifyTracking();
  }, [notifyTracking]);

  // ---------------------------------------------------------------------------
  // Toolbar actions — forwarded to the active canvas
  // ---------------------------------------------------------------------------

  const getActiveCanvas = useCallback((): ShapeCanvasHandle | null => {
    if (!activeFigure) return null;
    return canvasRefs.current[activeFigure]?.current ?? null;
  }, [activeFigure]);

  const handleUndo = useCallback(() => {
    getActiveCanvas()?.undo();
    notifyTracking();
  }, [getActiveCanvas, notifyTracking]);

  const handleRedo = useCallback(() => {
    getActiveCanvas()?.redo();
    notifyTracking();
  }, [getActiveCanvas, notifyTracking]);

  const handleDelete = useCallback(() => {
    getActiveCanvas()?.deleteSelected();
    notifyTracking();
  }, [getActiveCanvas, notifyTracking]);

  const handleDuplicate = useCallback(() => {
    getActiveCanvas()?.duplicateSelected();
    notifyTracking();
  }, [getActiveCanvas, notifyTracking]);

  const handleFillColor = useCallback((color: string) => {
    setFillColor(color);
    getActiveCanvas()?.setFillColor(color);
  }, [getActiveCanvas]);

  const handleBorderColor = useCallback((color: string) => {
    setBorderColor(color);
    getActiveCanvas()?.setBorderColor(color);
  }, [getActiveCanvas]);

  // Determine if active canvas has a selection (simplified — always allow buttons)
  const [hasSelection, setHasSelection] = useState(false);
  // We track this by watching activeFigure changes (rough approximation)
  useEffect(() => { setHasSelection(false); }, [activeFigure]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Instructions */}
      <p className="text-sm leading-relaxed text-foreground bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        {instructions}
      </p>

      {/* Shared toolbar */}
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
        hasSelection={hasSelection}
      />

      {/* Active canvas hint */}
      {activeFigure ? (
        <p className="text-xs text-center text-blue-600 -mt-2">
          Drawing in Figure {activeFigure.split("-")[1]} — Row {parseInt(activeFigure.split("-")[0]) + 1}
        </p>
      ) : (
        <p className="text-xs text-center text-muted-foreground -mt-2">
          Click on Figure A or Figure B to start drawing
        </p>
      )}

      {/* Column headers */}
      <div className="grid grid-cols-3 gap-4 pl-9">
        <div className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Model (Reference)
        </div>
        <div className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Your Drawing — Figure A
        </div>
        <div className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Your Drawing — Figure B
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-8">
        {rows.map((row, i) => {
          const keyA = `${i}-A`;
          const keyB = `${i}-B`;
          return (
            <RowSection
              key={row.row_number}
              rowIndex={i}
              rowNumber={row.row_number}
              modelSnapshot={row.model_snapshot}
              figureARules={row.figureA_rules}
              figureBRules={row.figureB_rules}
              activeFigure={activeFigure}
              onFigureActivate={handleFigureActivate}
              figureARef={canvasRefs.current[keyA] as React.RefObject<ShapeCanvasHandle | null>}
              figureBRef={canvasRefs.current[keyB] as React.RefObject<ShapeCanvasHandle | null>}
              activeTool={activeTool}
              fillColor={fillColor}
              borderColor={borderColor}
              onFirstShapeDrawn={handleFirstShapeDrawn}
            />
          );
        })}
      </div>

      {/* Rule legend */}
      <div className="flex items-center gap-4 justify-center pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-blue-600" />
          <span className="text-xs text-muted-foreground">Required rule (follow this)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-gray-200" />
          <span className="text-xs text-muted-foreground">Not required for this figure</span>
        </div>
      </div>
    </div>
  );
}

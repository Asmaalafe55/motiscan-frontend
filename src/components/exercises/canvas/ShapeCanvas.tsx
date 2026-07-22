"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { DrawnShapeData } from "@/types";
import { toImageSrc } from "@/lib/svg";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToolType =
  | "select"
  | "pen"
  | "rect"
  | "circle"
  | "triangle"
  | "diamond"
  | "arrow"
  | "line";

export interface CanvasShape {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  borderColor: string;
  points?: { x: number; y: number }[]; // for freehand / line / arrow
  drawn_order: number;
}

export interface CanvasStats {
  totalShapesDrawn: number;
  shapesDeleted: number;
  shapesMoved: number;
  undoCount: number;
  redoCount: number;
  timeFirstShapeDrawn?: number; // ms since canvas mounted
}

export interface ShapeCanvasHandle {
  getSnapshot: () => string;
  getShapesData: () => DrawnShapeData[];
  getStats: () => CanvasStats;
  setTool: (tool: ToolType) => void;
  setFillColor: (color: string) => void;
  setBorderColor: (color: string) => void;
  undo: () => void;
  redo: () => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
}

interface ShapeCanvasProps {
  readOnly?: boolean;
  modelSnapshot?: string;
  isActive?: boolean;
  onFirstShapeDrawn?: () => void;
  onShapeCountChange?: (count: number) => void;
  activeTool: ToolType;
  fillColor: string;
  borderColor: string;
}

// ---------------------------------------------------------------------------
// Hit-testing helpers
// ---------------------------------------------------------------------------

const HANDLE_SIZE = 8;

function pointInRect(
  px: number,
  py: number,
  x: number,
  y: number,
  w: number,
  h: number
) {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

function shapeBounds(s: CanvasShape) {
  if (s.type === "circle") {
    const rx = Math.abs(s.width) / 2;
    const ry = Math.abs(s.height) / 2;
    return {
      x: s.x + Math.min(0, s.width),
      y: s.y + Math.min(0, s.height),
      w: Math.abs(s.width),
      h: Math.abs(s.height),
      cx: s.x + s.width / 2,
      cy: s.y + s.height / 2,
      rx,
      ry,
    };
  }
  return {
    x: s.x + Math.min(0, s.width),
    y: s.y + Math.min(0, s.height),
    w: Math.abs(s.width),
    h: Math.abs(s.height),
  };
}

/** Max board size (px) — keeps teacher/student boards compact and square. */
export const SHAPE_BOARD_MAX_PX = 280;

function hitTest(s: CanvasShape, px: number, py: number): boolean {
  const b = shapeBounds(s);
  if (s.type === "pen" || s.type === "line" || s.type === "arrow") {
    if (!s.points || s.points.length < 2) return false;
    for (let i = 1; i < s.points.length; i++) {
      const ax = s.points[i - 1].x;
      const ay = s.points[i - 1].y;
      const bx = s.points[i].x;
      const by = s.points[i].y;
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy;
      if (len2 === 0) continue;
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      const distX = px - (ax + t * dx);
      const distY = py - (ay + t * dy);
      if (distX * distX + distY * distY < 64) return true;
    }
    return false;
  }
  if (s.type === "circle") {
    const cx = s.x + s.width / 2;
    const cy = s.y + s.height / 2;
    const rx = Math.abs(s.width) / 2 || 1;
    const ry = Math.abs(s.height) / 2 || 1;
    const dx = (px - cx) / rx;
    const dy = (py - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }
  return pointInRect(px, py, b.x, b.y, b.w, b.h);
}

// Returns which resize handle (0-7) is under the cursor, or -1
function getResizeHandle(s: CanvasShape, px: number, py: number): number {
  const b = shapeBounds(s);
  const handles = [
    { x: b.x, y: b.y },
    { x: b.x + b.w / 2, y: b.y },
    { x: b.x + b.w, y: b.y },
    { x: b.x + b.w, y: b.y + b.h / 2 },
    { x: b.x + b.w, y: b.y + b.h },
    { x: b.x + b.w / 2, y: b.y + b.h },
    { x: b.x, y: b.y + b.h },
    { x: b.x, y: b.y + b.h / 2 },
  ];
  for (let i = 0; i < handles.length; i++) {
    const h = handles[i];
    if (Math.abs(px - h.x) <= HANDLE_SIZE && Math.abs(py - h.y) <= HANDLE_SIZE) return i;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

function drawShape(ctx: CanvasRenderingContext2D, s: CanvasShape) {
  ctx.save();
  ctx.fillStyle = s.fillColor;
  ctx.strokeStyle = s.borderColor;
  ctx.lineWidth = 2;

  if (s.type === "pen") {
    if (!s.points || s.points.length < 2) {
      ctx.restore();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x, s.points[i].y);
    }
    ctx.strokeStyle = s.borderColor || s.fillColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (s.type === "line") {
    if (!s.points || s.points.length < 2) {
      ctx.restore();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    ctx.lineTo(s.points[s.points.length - 1].x, s.points[s.points.length - 1].y);
    ctx.strokeStyle = s.borderColor || s.fillColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (s.type === "arrow") {
    if (!s.points || s.points.length < 2) {
      ctx.restore();
      return;
    }
    const p0 = s.points[0];
    const p1 = s.points[s.points.length - 1];
    const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    const headLen = 14;
    ctx.strokeStyle = s.borderColor || s.fillColor;
    ctx.fillStyle = s.borderColor || s.fillColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p1.x - headLen * Math.cos(angle - Math.PI / 6), p1.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(p1.x - headLen * Math.cos(angle + Math.PI / 6), p1.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  } else if (s.type === "rect") {
    const x = s.x + Math.min(0, s.width);
    const y = s.y + Math.min(0, s.height);
    const w = Math.abs(s.width);
    const h = Math.abs(s.height);
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();
  } else if (s.type === "circle") {
    const cx = s.x + s.width / 2;
    const cy = s.y + s.height / 2;
    const rx = Math.abs(s.width) / 2;
    const ry = Math.abs(s.height) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx || 1, ry || 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (s.type === "triangle") {
    const x = s.x + Math.min(0, s.width);
    const y = s.y + Math.min(0, s.height);
    const w = Math.abs(s.width);
    const h = Math.abs(s.height);
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (s.type === "diamond") {
    const x = s.x + Math.min(0, s.width);
    const y = s.y + Math.min(0, s.height);
    const w = Math.abs(s.width);
    const h = Math.abs(s.height);
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w / 2, y + h);
    ctx.lineTo(x, y + h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawHandles(ctx: CanvasRenderingContext2D, s: CanvasShape) {
  const b = shapeBounds(s);
  const handles = [
    { x: b.x, y: b.y },
    { x: b.x + b.w / 2, y: b.y },
    { x: b.x + b.w, y: b.y },
    { x: b.x + b.w, y: b.y + b.h / 2 },
    { x: b.x + b.w, y: b.y + b.h },
    { x: b.x + b.w / 2, y: b.y + b.h },
    { x: b.x, y: b.y + b.h },
    { x: b.x, y: b.y + b.h / 2 },
  ];

  ctx.save();
  // Selection outline
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
  ctx.setLineDash([]);

  // Resize handles
  for (const h of handles) {
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;
    ctx.fillRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    ctx.strokeRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ShapeCanvas = forwardRef<ShapeCanvasHandle, ShapeCanvasProps>(
  function ShapeCanvas(
    { readOnly = false, modelSnapshot, isActive = false, onFirstShapeDrawn, onShapeCountChange, activeTool, fillColor, borderColor },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Shapes state stored in a ref to avoid re-render on every draw
    const shapesRef = useRef<CanvasShape[]>([]);
    const historyRef = useRef<CanvasShape[][]>([[]]); // undo stack
    const redoStackRef = useRef<CanvasShape[][]>([]);
    const selectedIdRef = useRef<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Drawing state
    const isDrawingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const currentShapeRef = useRef<CanvasShape | null>(null);
    const penPointsRef = useRef<{ x: number; y: number }[]>([]);

    // Move / resize state
    const isDraggingShapeRef = useRef(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const isResizingRef = useRef(false);
    const resizeHandleRef = useRef(-1);
    const resizeOriginRef = useRef<CanvasShape | null>(null);

    // Stats
    const statsRef = useRef<CanvasStats>({
      totalShapesDrawn: 0,
      shapesDeleted: 0,
      shapesMoved: 0,
      undoCount: 0,
      redoCount: 0,
    });
    const mountedAtRef = useRef(Date.now());
    const drawnCountRef = useRef(0);

    // Active tool/colors forwarded from parent toolbar via props
    const activeToolRef = useRef<ToolType>(activeTool);
    const fillColorRef = useRef(fillColor);
    const borderColorRef = useRef(borderColor);

    // Keep refs in sync with props
    useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
    useEffect(() => { fillColorRef.current = fillColor; }, [fillColor]);
    useEffect(() => { borderColorRef.current = borderColor; }, [borderColor]);

    // ---------------------------------------------------------------------------
    // Render loop
    // ---------------------------------------------------------------------------

    const render = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // If readOnly, draw modelSnapshot to fill the square board
      if (readOnly && modelSnapshot) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = toImageSrc(modelSnapshot);
        return;
      }

      // Draw all shapes
      for (const s of shapesRef.current) {
        drawShape(ctx, s);
      }

      // Draw current in-progress shape
      if (currentShapeRef.current) {
        drawShape(ctx, currentShapeRef.current);
      }

      // Draw selection handles
      const sel = shapesRef.current.find((s) => s.id === selectedIdRef.current);
      if (sel) {
        drawHandles(ctx, sel);
      }
    }, [readOnly, modelSnapshot]);

    // Re-render on model snapshot change
    useEffect(() => {
      render();
    }, [render, modelSnapshot]);

    // ---------------------------------------------------------------------------
    // History helpers
    // ---------------------------------------------------------------------------

    const pushHistory = useCallback(() => {
      historyRef.current.push(shapesRef.current.map((s) => ({ ...s, points: s.points ? [...s.points] : undefined })));
      redoStackRef.current = [];
    }, []);

    // ---------------------------------------------------------------------------
    // Imperative handle exposed to parent
    // ---------------------------------------------------------------------------

    useImperativeHandle(ref, () => ({
      getSnapshot() {
        const canvas = canvasRef.current;
        if (!canvas) return "";
        return canvas.toDataURL("image/png");
      },
      getShapesData(): DrawnShapeData[] {
        return shapesRef.current.map((s) => ({
          shape_type: s.type,
          fill_color: s.fillColor,
          border_color: s.borderColor,
          position: { x: s.x, y: s.y },
          size: { width: s.width, height: s.height },
          drawn_order: s.drawn_order,
        }));
      },
      getStats() {
        return { ...statsRef.current };
      },
      setTool(tool: ToolType) {
        activeToolRef.current = tool;
      },
      setFillColor(color: string) {
        fillColorRef.current = color;
        // Apply to selected shape
        if (selectedIdRef.current) {
          shapesRef.current = shapesRef.current.map((s) =>
            s.id === selectedIdRef.current ? { ...s, fillColor: color } : s
          );
          render();
        }
      },
      setBorderColor(color: string) {
        borderColorRef.current = color;
        if (selectedIdRef.current) {
          shapesRef.current = shapesRef.current.map((s) =>
            s.id === selectedIdRef.current ? { ...s, borderColor: color } : s
          );
          render();
        }
      },
      undo() {
        if (historyRef.current.length <= 1) return;
        const current = historyRef.current.pop()!;
        redoStackRef.current.push(current);
        shapesRef.current = historyRef.current[historyRef.current.length - 1].map((s) => ({
          ...s,
          points: s.points ? [...s.points] : undefined,
        }));
        selectedIdRef.current = null;
        setSelectedId(null);
        statsRef.current.undoCount++;
        render();
      },
      redo() {
        if (redoStackRef.current.length === 0) return;
        const next = redoStackRef.current.pop()!;
        historyRef.current.push(next);
        shapesRef.current = next.map((s) => ({
          ...s,
          points: s.points ? [...s.points] : undefined,
        }));
        statsRef.current.redoCount++;
        render();
      },
      deleteSelected() {
        if (!selectedIdRef.current) return;
        pushHistory();
        shapesRef.current = shapesRef.current.filter((s) => s.id !== selectedIdRef.current);
        statsRef.current.shapesDeleted++;
        selectedIdRef.current = null;
        setSelectedId(null);
        onShapeCountChange?.(shapesRef.current.length);
        render();
      },
      duplicateSelected() {
        const sel = shapesRef.current.find((s) => s.id === selectedIdRef.current);
        if (!sel) return;
        pushHistory();
        const newShape: CanvasShape = {
          ...sel,
          id: `shape-${Date.now()}-${Math.random()}`,
          x: sel.x + 20,
          y: sel.y + 20,
          points: sel.points ? sel.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })) : undefined,
          drawn_order: ++drawnCountRef.current,
        };
        shapesRef.current = [...shapesRef.current, newShape];
        selectedIdRef.current = newShape.id;
        setSelectedId(newShape.id);
        statsRef.current.totalShapesDrawn++;
        onShapeCountChange?.(shapesRef.current.length);
        render();
      },
    }), [render, pushHistory, onShapeCountChange]);

    // ---------------------------------------------------------------------------
    // Canvas sizing
    // ---------------------------------------------------------------------------

    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const resize = () => {
        const size = Math.min(container.clientWidth, SHAPE_BOARD_MAX_PX);
        canvas.width = size;
        canvas.height = size;
        render();
      };

      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(container);
      return () => ro.disconnect();
    }, [render]);

    // ---------------------------------------------------------------------------
    // Pointer helpers
    // ---------------------------------------------------------------------------

    function getCanvasPoint(e: React.PointerEvent<HTMLCanvasElement>) {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    }

    function getCursor(): string {
      if (readOnly) return "default";
      if (activeToolRef.current === "select") return "default";
      return "crosshair";
    }

    // ---------------------------------------------------------------------------
    // Pointer events
    // ---------------------------------------------------------------------------

    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (readOnly) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const { x, y } = getCanvasPoint(e);
      const tool = activeToolRef.current;

      if (tool === "select") {
        // Check if we're clicking a resize handle on selected shape first
        const sel = shapesRef.current.find((s) => s.id === selectedIdRef.current);
        if (sel) {
          const handle = getResizeHandle(sel, x, y);
          if (handle !== -1) {
            isResizingRef.current = true;
            resizeHandleRef.current = handle;
            resizeOriginRef.current = { ...sel, points: sel.points ? [...sel.points] : undefined };
            return;
          }
        }

        // Check if clicking on a shape (from top)
        const clicked = [...shapesRef.current].reverse().find((s) => hitTest(s, x, y));
        if (clicked) {
          selectedIdRef.current = clicked.id;
          setSelectedId(clicked.id);
          isDraggingShapeRef.current = true;
          dragOffsetRef.current = { x: x - clicked.x, y: y - clicked.y };
          render();
        } else {
          selectedIdRef.current = null;
          setSelectedId(null);
          render();
        }
        return;
      }

      // Drawing tools
      isDrawingRef.current = true;
      dragStartRef.current = { x, y };
      penPointsRef.current = [{ x, y }];

      const newShape: CanvasShape = {
        id: `shape-${Date.now()}-${Math.random()}`,
        type: tool,
        x,
        y,
        width: 0,
        height: 0,
        fillColor: fillColorRef.current,
        borderColor: borderColorRef.current,
        points: tool === "pen" || tool === "line" || tool === "arrow" ? [{ x, y }] : undefined,
        drawn_order: drawnCountRef.current + 1,
      };
      currentShapeRef.current = newShape;
    };

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (readOnly) return;
      const { x, y } = getCanvasPoint(e);

      if (isDraggingShapeRef.current && selectedIdRef.current) {
        pushHistory();
        shapesRef.current = shapesRef.current.map((s) => {
          if (s.id !== selectedIdRef.current) return s;
          const dx = x - dragOffsetRef.current.x - s.x;
          const dy = y - dragOffsetRef.current.y - s.y;
          const moved: CanvasShape = {
            ...s,
            x: x - dragOffsetRef.current.x,
            y: y - dragOffsetRef.current.y,
            points: s.points ? s.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) : undefined,
          };
          return moved;
        });
        statsRef.current.shapesMoved++;
        render();
        return;
      }

      if (isResizingRef.current && selectedIdRef.current && resizeOriginRef.current) {
        const orig = resizeOriginRef.current;
        const b = shapeBounds(orig);
        let newX = b.x, newY = b.y, newW = b.w, newH = b.h;

        const h = resizeHandleRef.current;
        if (h === 0) { newX = x; newY = y; newW = b.x + b.w - x; newH = b.y + b.h - y; }
        else if (h === 1) { newY = y; newH = b.y + b.h - y; }
        else if (h === 2) { newY = y; newW = x - b.x; newH = b.y + b.h - y; }
        else if (h === 3) { newW = x - b.x; }
        else if (h === 4) { newW = x - b.x; newH = y - b.y; }
        else if (h === 5) { newH = y - b.y; }
        else if (h === 6) { newX = x; newW = b.x + b.w - x; newH = y - b.y; }
        else if (h === 7) { newX = x; newW = b.x + b.w - x; }

        shapesRef.current = shapesRef.current.map((s) =>
          s.id === selectedIdRef.current
            ? { ...s, x: newX, y: newY, width: newW, height: newH }
            : s
        );
        render();
        return;
      }

      if (!isDrawingRef.current || !currentShapeRef.current) return;

      const start = dragStartRef.current;
      const shape = currentShapeRef.current;

      if (shape.type === "pen") {
        penPointsRef.current.push({ x, y });
        currentShapeRef.current = { ...shape, points: [...penPointsRef.current] };
      } else if (shape.type === "line" || shape.type === "arrow") {
        currentShapeRef.current = {
          ...shape,
          points: [{ x: start.x, y: start.y }, { x, y }],
        };
      } else {
        currentShapeRef.current = {
          ...shape,
          x: start.x,
          y: start.y,
          width: x - start.x,
          height: y - start.y,
        };
      }

      render();
    };

    const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (readOnly) return;

      if (isDraggingShapeRef.current) {
        isDraggingShapeRef.current = false;
        return;
      }

      if (isResizingRef.current) {
        isResizingRef.current = false;
        resizeOriginRef.current = null;
        return;
      }

      if (!isDrawingRef.current || !currentShapeRef.current) return;
      isDrawingRef.current = false;

      const s = currentShapeRef.current;
      const minSize = s.type === "pen" || s.type === "line" || s.type === "arrow";
      const tooSmall =
        !minSize &&
        Math.abs(s.width) < 5 &&
        Math.abs(s.height) < 5;
      const tooFewPoints =
        minSize &&
        (!s.points || s.points.length < 2);

      if (!tooSmall && !tooFewPoints) {
        pushHistory();
        drawnCountRef.current++;
        statsRef.current.totalShapesDrawn++;

        if (statsRef.current.timeFirstShapeDrawn === undefined) {
          statsRef.current.timeFirstShapeDrawn = Date.now() - mountedAtRef.current;
          onFirstShapeDrawn?.();
        }

        const finalShape = { ...s, drawn_order: drawnCountRef.current };
        shapesRef.current = [...shapesRef.current, finalShape];
        selectedIdRef.current = finalShape.id;
        setSelectedId(finalShape.id);
        onShapeCountChange?.(shapesRef.current.length);
      }

      currentShapeRef.current = null;
      render();
    };

    // ---------------------------------------------------------------------------
    // Double-click to edit colors inline
    // ---------------------------------------------------------------------------

    const onDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (readOnly) return;
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      const clicked = [...shapesRef.current].reverse().find((s) => hitTest(s, x, y));
      if (clicked) {
        selectedIdRef.current = clicked.id;
        setSelectedId(clicked.id);
        render();
      }
    };

    // ---------------------------------------------------------------------------
    // Render readOnly model snapshot
    // ---------------------------------------------------------------------------

    useEffect(() => {
      if (!readOnly || !modelSnapshot) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = toImageSrc(modelSnapshot);
    }, [readOnly, modelSnapshot]);

    // ---------------------------------------------------------------------------
    // JSX
    // ---------------------------------------------------------------------------

    return (
      <div
        ref={containerRef}
        className={`relative mx-auto w-full max-w-[280px] aspect-square rounded-lg overflow-hidden transition-all ${
          readOnly
            ? "bg-[#f8f8f8] cursor-default"
            : isActive
            ? "ring-2 ring-blue-400 bg-white"
            : "ring-1 ring-border bg-white"
        }`}
      >
        {/* Model badge */}
        {readOnly && (
          <div className="absolute top-2 left-2 z-10 rounded-md bg-gray-200/90 px-2 py-0.5 text-[11px] font-semibold text-gray-600 tracking-wide select-none">
            Model
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          style={{ cursor: getCursor() }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onDoubleClick={onDoubleClick}
        />
      </div>
    );
  }
);

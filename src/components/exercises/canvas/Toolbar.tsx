"use client";

import { useState, useRef, useEffect } from "react";
import {
  MousePointer2,
  Trash2,
  Copy,
  Pencil,
  Square,
  Circle,
  Triangle,
  Diamond,
  ArrowRight,
  Minus,
  Undo2,
  Redo2,
  Pipette,
} from "lucide-react";
import type { ToolType } from "./ShapeCanvas";

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

const PALETTE = [
  { label: "Black",  value: "#1a1a1a" },
  { label: "White",  value: "#ffffff" },
  { label: "Grey",   value: "#9ca3af" },
  { label: "Red",    value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Yellow", value: "#eab308" },
  { label: "Green",  value: "#22c55e" },
  { label: "Blue",   value: "#3b82f6" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Brown",  value: "#92400e" },
  { label: "Pink",   value: "#ec4899" },
  { label: "Teal",   value: "#14b8a6" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ToolbarProps {
  activeTool: ToolType;
  fillColor: string;
  borderColor: string;
  onToolChange: (tool: ToolType) => void;
  onFillColorChange: (color: string) => void;
  onBorderColorChange: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  hasSelection: boolean;
}

// ---------------------------------------------------------------------------
// Color picker popover
// ---------------------------------------------------------------------------

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  icon: React.ReactNode;
}

function ColorPicker({ label, value, onChange, icon }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title={label}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-muted transition-colors border border-border"
      >
        {icon}
        <span
          className="inline-block w-4 h-4 rounded-sm border border-border shadow-sm"
          style={{ background: value }}
        />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 rounded-xl border border-border bg-white shadow-xl p-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
            {label}
          </p>
          <div className="grid grid-cols-6 gap-1">
            {PALETTE.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => { onChange(c.value); setOpen(false); }}
                className="w-6 h-6 rounded-md border-2 transition-transform hover:scale-110"
                style={{
                  background: c.value,
                  borderColor: value === c.value ? "#3b82f6" : "#d1d5db",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool button
// ---------------------------------------------------------------------------

interface ToolBtnProps {
  tool: ToolType;
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function ToolBtn({ active, label, icon, onClick }: ToolBtnProps) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`rounded-lg p-2 transition-colors ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "hover:bg-muted text-foreground"
      }`}
    >
      {icon}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

function Divider() {
  return <div className="w-px h-6 bg-border self-center mx-0.5" />;
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

export function DrawingToolbar({
  activeTool,
  fillColor,
  borderColor,
  onToolChange,
  onFillColorChange,
  onBorderColorChange,
  onUndo,
  onRedo,
  onDelete,
  onDuplicate,
  hasSelection,
}: ToolbarProps) {
  const iconSize = "h-4 w-4";

  const tools: { tool: ToolType; label: string; icon: React.ReactNode }[] = [
    { tool: "select",   label: "Select / Move",   icon: <MousePointer2 className={iconSize} /> },
    { tool: "pen",      label: "Freehand Pen",    icon: <Pencil className={iconSize} /> },
    { tool: "rect",     label: "Rectangle",       icon: <Square className={iconSize} /> },
    { tool: "circle",   label: "Circle / Ellipse",icon: <Circle className={iconSize} /> },
    { tool: "triangle", label: "Triangle",        icon: <Triangle className={iconSize} /> },
    { tool: "diamond",  label: "Diamond",         icon: <Diamond className={iconSize} /> },
    { tool: "arrow",    label: "Arrow",           icon: <ArrowRight className={iconSize} /> },
    { tool: "line",     label: "Line",            icon: <Minus className={iconSize} /> },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 bg-white rounded-2xl border border-border shadow px-3 py-2 sticky top-0 z-20">
      {/* Drawing tools */}
      {tools.map(({ tool, label, icon }) => (
        <ToolBtn
          key={tool}
          tool={tool}
          active={activeTool === tool}
          label={label}
          icon={icon}
          onClick={() => onToolChange(tool)}
        />
      ))}

      <Divider />

      {/* Color pickers */}
      <ColorPicker
        label="Fill Color"
        value={fillColor}
        onChange={onFillColorChange}
        icon={<Pipette className={iconSize} />}
      />
      <ColorPicker
        label="Border Color"
        value={borderColor}
        onChange={onBorderColorChange}
        icon={<span className="text-[10px] font-bold">B</span>}
      />

      <Divider />

      {/* Selection actions */}
      <button
        type="button"
        title="Delete selected shape"
        onClick={onDelete}
        disabled={!hasSelection}
        className="rounded-lg p-2 hover:bg-red-50 hover:text-red-600 text-foreground disabled:opacity-30 transition-colors"
      >
        <Trash2 className={iconSize} />
      </button>
      <button
        type="button"
        title="Duplicate selected shape"
        onClick={onDuplicate}
        disabled={!hasSelection}
        className="rounded-lg p-2 hover:bg-muted text-foreground disabled:opacity-30 transition-colors"
      >
        <Copy className={iconSize} />
      </button>

      <Divider />

      {/* Undo / Redo */}
      <button
        type="button"
        title="Undo"
        onClick={onUndo}
        className="rounded-lg p-2 hover:bg-muted text-foreground transition-colors"
      >
        <Undo2 className={iconSize} />
      </button>
      <button
        type="button"
        title="Redo"
        onClick={onRedo}
        className="rounded-lg p-2 hover:bg-muted text-foreground transition-colors"
      >
        <Redo2 className={iconSize} />
      </button>
    </div>
  );
}

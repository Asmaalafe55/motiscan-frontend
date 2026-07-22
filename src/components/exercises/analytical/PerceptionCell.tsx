"use client";

import { useEffect, useRef } from "react";
import { resolveMediaUrl } from "@/lib/mediaUrl";

interface PerceptionCellProps {
  cellLabel: string;          // e.g. "A1"
  designSvg: string;          // raw SVG string or data/URL for the complex design
  sectionSvg: string;         // raw SVG string or data/URL for the section shape
  value: number | null;       // current selected answer (null = not answered)
  onChange: (value: number) => void;
  onTimeUpdate?: (seconds: number) => void;
}

const ANSWER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

export function PerceptionCellComponent({
  cellLabel,
  designSvg,
  sectionSvg,
  value,
  onChange,
  onTimeUpdate,
}: PerceptionCellProps) {
  const mountedAt = useRef(Date.now());
  const designSrc = resolveMediaUrl(designSvg);
  const sectionSrc = resolveMediaUrl(sectionSvg);

  // Report elapsed time to parent on unmount / interval
  useEffect(() => {
    if (!onTimeUpdate) return;
    const interval = setInterval(() => {
      onTimeUpdate(Math.floor((Date.now() - mountedAt.current) / 1000));
    }, 5000);
    return () => {
      clearInterval(interval);
      onTimeUpdate(Math.floor((Date.now() - mountedAt.current) / 1000));
    };
  }, [onTimeUpdate]);

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Cell label */}
      <div className="flex items-center px-2 pt-1.5 pb-0">
        <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
          {cellLabel}
        </span>
      </div>

      {/* Complex design — rendered as <img> so the SVG is always contained.
          dangerouslySetInnerHTML with a viewBox-only SVG produces an element
          with no intrinsic height that overflows its parent. */}
      <div
        className="flex items-center justify-center p-2 bg-white overflow-hidden"
        style={{ height: 140 }}
      >
        {designSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={designSrc}
            alt={`Design ${cellLabel}`}
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center rounded border border-dashed border-gray-200 bg-gray-50 text-[11px] text-gray-300">
            No design
          </div>
        )}
      </div>

      {/* Bottom row: dropdown + section shape */}
      <div className="flex items-center gap-2 border-t border-gray-100 px-2 py-2 bg-gray-50">
        {/* Dropdown */}
        <select
          value={value ?? ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`flex-1 rounded-md border text-sm px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${
            value !== null
              ? "border-indigo-300 text-indigo-700 font-semibold"
              : "border-gray-200 text-gray-400"
          }`}
        >
          <option value="" disabled>— select —</option>
          {ANSWER_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        {/* Section shape — also as <img> to guarantee containment */}
        <div
          className="flex-shrink-0 w-10 h-10 overflow-hidden"
          title="Section shape"
        >
          {sectionSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sectionSrc}
              alt="Section shape"
              className="w-full h-full object-contain"
              draggable={false}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

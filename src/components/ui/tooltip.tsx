"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TooltipSide = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: TooltipSide;
  className?: string;
  /** Extra classes for the outer wrapper (e.g. sizing). */
  wrapperClassName?: string;
}

const SIDE_POSITION: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

/**
 * Lightweight, dependency-free tooltip. Reveals `content` on hover/focus of the
 * wrapped children via CSS. Uses `group-hover`/`group-focus-within` so it works
 * for both mouse and keyboard users.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  className,
  wrapperClassName,
}: TooltipProps) {
  return (
    <span className={cn("relative inline-flex group", wrapperClassName)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 max-w-xs whitespace-normal rounded-md bg-gray-900 px-2.5 py-1.5 text-center text-xs font-medium leading-snug text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
          SIDE_POSITION[side],
          className
        )}
      >
        {content}
      </span>
    </span>
  );
}

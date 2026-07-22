"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Optional labels rendered on each side of the track. */
  onLabel?: string;
  offLabel?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, disabled, className, onLabel, offLabel, ...props }, ref) => {
    const hasLabels = onLabel !== undefined || offLabel !== undefined;

    return (
      <span className="inline-flex items-center gap-2">
        {hasLabels && (
          <span
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              checked ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {checked ? onLabel ?? "On" : offLabel ?? "Off"}
          </span>
        )}
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => !disabled && onCheckedChange(!checked)}
          className={cn(
            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            checked ? "bg-green-500" : "bg-gray-300",
            className
          )}
          {...props}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform",
              checked ? "translate-x-[22px]" : "translate-x-0.5"
            )}
          />
        </button>
      </span>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };

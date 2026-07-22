"use client";

import * as React from "react";
import { toast } from "@/hooks/use-toast";

/**
 * Lightweight, framework-agnostic store for real-time activity notifications.
 *
 * A single `pushActivity` call does two things:
 *   1. Pops a Toast notification in the corner of the screen.
 *   2. Prepends the event to an in-memory "live feed" that the Dashboard's
 *      Recent Activity card merges on top of its historical data.
 *
 * This mirrors the pattern used by `use-toast.ts` (module-level state +
 * subscribers) so it can be driven from socket handlers or plain async code
 * outside of React components.
 */

export type ActivityType = "submission" | "report";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  studentId?: string;
  studentName: string;
  examId?: string;
  examTitle?: string;
  /** ISO timestamp of when the activity happened. */
  timestamp: string;
}

const MAX_LIVE_ACTIVITIES = 50;

let liveActivities: ActivityItem[] = [];
const listeners = new Set<(items: ActivityItem[]) => void>();

let seq = 0;
function genId() {
  seq = (seq + 1) % Number.MAX_SAFE_INTEGER;
  return `live-${Date.now()}-${seq}`;
}

function emit() {
  for (const listener of listeners) listener(liveActivities);
}

/** Builds the Toast copy for a given activity. */
function toastContent(item: ActivityItem): { title: string; description: string } {
  if (item.type === "report") {
    return {
      title: `New report received for ${item.studentName}!`,
      description: item.examTitle
        ? `AI evaluation ready — ${item.examTitle}`
        : "AI evaluation report generated.",
    };
  }
  return {
    title: `${item.studentName} submitted a new response.`,
    description: item.examTitle ? item.examTitle : "A new submission is ready to review.",
  };
}

/**
 * Records a real-time activity: fires a Toast AND prepends it to the live feed.
 * Returns the created item.
 */
export function pushActivity(
  input: Omit<ActivityItem, "id" | "timestamp"> & { timestamp?: string }
): ActivityItem {
  const item: ActivityItem = {
    ...input,
    id: genId(),
    timestamp: input.timestamp ?? new Date().toISOString(),
  };

  liveActivities = [item, ...liveActivities].slice(0, MAX_LIVE_ACTIVITIES);
  emit();

  const { title, description } = toastContent(item);
  toast({ title, description });

  return item;
}

export function getLiveActivities(): ActivityItem[] {
  return liveActivities;
}

export function subscribeLiveActivities(cb: (items: ActivityItem[]) => void): () => void {
  listeners.add(cb);
  cb(liveActivities);
  return () => {
    listeners.delete(cb);
  };
}

/** React hook: subscribe a component to the live activity feed. */
export function useLiveActivities(): ActivityItem[] {
  const [items, setItems] = React.useState<ActivityItem[]>(getLiveActivities());
  React.useEffect(() => subscribeLiveActivities(setItems), []);
  return items;
}

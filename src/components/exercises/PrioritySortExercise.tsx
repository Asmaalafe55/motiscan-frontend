"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { PrioritySortData, PrioritySortTracking, PrioritySortTask } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PrioritySortExerciseProps {
  instructions: string;
  data: PrioritySortData;
  /** Serialized answer (pipe-separated titles, in rank order) */
  value: string;
  onChange: (value: string) => void;
  onTrackingUpdate: (tracking: PrioritySortTracking) => void;
}

const serializeOrder = (order: PrioritySortTask[]): string =>
  order.map((t) => t.title).join(" | ");

export function PrioritySortExercise({
  instructions,
  data,
  value,
  onChange,
  onTrackingUpdate,
}: PrioritySortExerciseProps) {
  const total = data.tasks.length;
  const mountedAt = useRef<number>(Date.now());
  const firstSelectAt = useRef<number | null>(null);
  const lastEmittedValue = useRef<string>("");

  const [order, setOrder] = useState<PrioritySortTask[]>([]);

  const [tracking, setTracking] = useState<PrioritySortTracking>({
    final_order: [],
    time_to_first_move: undefined,
    total_moves: 0,
    reorder_count: 0,
    time_spent_seconds: 0,
    skipped: true,
  });

  const selectedIds = useMemo(() => new Set(order.map((t) => t.id)), [order]);

  const isFirstTracking = useRef(true);
  const prevTrackingRef = useRef(tracking);

  useEffect(() => {
    if (isFirstTracking.current) {
      isFirstTracking.current = false;
      return;
    }
    if (prevTrackingRef.current !== tracking) {
      prevTrackingRef.current = tracking;
      onTrackingUpdate(tracking);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking]);

  useEffect(() => {
    const id = setInterval(() => {
      setTracking((prev) => ({
        ...prev,
        time_spent_seconds: Math.floor((Date.now() - mountedAt.current) / 1000),
      }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleTaskClick = (task: PrioritySortTask) => {
    if (selectedIds.has(task.id) || order.length >= total) return;

    if (firstSelectAt.current === null) {
      firstSelectAt.current = Date.now();
    }

    const next = [...order, task];
    const serialized = serializeOrder(next);
    lastEmittedValue.current = serialized;
    setOrder(next);
    onChange(serialized);

    setTracking((prev) => {
      const now = Date.now();
      const ttfm =
        prev.time_to_first_move !== undefined
          ? prev.time_to_first_move
          : Math.floor(((firstSelectAt.current ?? now) - mountedAt.current) / 1000);
      return {
        final_order: next.map((t) => t.title),
        total_moves: prev.total_moves + 1,
        reorder_count: prev.reorder_count,
        time_spent_seconds: Math.floor((now - mountedAt.current) / 1000),
        skipped: next.length < total,
        time_to_first_move: ttfm,
      };
    });
  };

  const handleRemoveAt = (index: number) => {
    if (index < 0 || index >= order.length) return;

    const next = order.filter((_, i) => i !== index);
    const serialized = serializeOrder(next);
    lastEmittedValue.current = serialized;
    setOrder(next);
    onChange(serialized);

    setTracking((prev) => {
      const now = Date.now();
      return {
        final_order: next.map((t) => t.title),
        total_moves: prev.total_moves + 1,
        reorder_count: prev.reorder_count + 1,
        time_spent_seconds: Math.floor((now - mountedAt.current) / 1000),
        skipped: next.length < total,
        time_to_first_move: prev.time_to_first_move,
      };
    });
  };

  const handleClear = () => {
    setOrder([]);
    lastEmittedValue.current = "";
    firstSelectAt.current = null;
    mountedAt.current = Date.now();
    setTracking({
      final_order: [],
      time_to_first_move: undefined,
      total_moves: 0,
      reorder_count: 0,
      time_spent_seconds: 0,
      skipped: true,
    });
    onChange("");
  };

  useEffect(() => {
    // Hydrate from parent when value changes externally (not from our own onChange)
    const v = value?.trim() ?? "";
    if (v === lastEmittedValue.current) return;

    if (!v) {
      setOrder([]);
      lastEmittedValue.current = "";
      return;
    }

    const parts = v.split("|").map((s) => s.trim()).filter(Boolean);
    const rebuilt: PrioritySortTask[] = [];
    for (const title of parts) {
      const t = data.tasks.find((x) => x.title === title);
      if (t) rebuilt.push(t);
    }
    if (rebuilt.length > 0) {
      setOrder(rebuilt);
      lastEmittedValue.current = v;
    }
  }, [value, data.tasks]);

  const selectedCount = order.length;

  return (
    <div className="flex flex-col gap-4 w-full">
      <p className="text-base leading-relaxed text-foreground">{instructions}</p>

      {/* grid-template-areas: mobile stacks each column; md aligns headers in one row and cards below */}
      <div
        className="grid grid-cols-1 gap-x-6 gap-y-3 [grid-template-areas:'tasks-h'_'tasks-c'_'rank-h'_'rank-c'] md:grid-cols-2 md:[grid-template-areas:'tasks-h_rank-h'_'tasks-c_rank-c']"
      >
        <div className="flex items-center min-h-9 [grid-area:tasks-h]">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide leading-none">
            Tasks
          </h3>
        </div>
        <div className="flex items-center justify-between gap-2 min-h-9 [grid-area:rank-h]">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide leading-none">
            Your ranking
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={handleClear} className="text-xs shrink-0">
            Clear
          </Button>
        </div>

        <Card className="min-h-[220px] p-3 flex flex-col gap-2 bg-muted/50 border-dashed border-2 border-border [grid-area:tasks-c]">
          <div className="flex flex-col gap-2">
            {data.tasks.map((task) => {
              const used = selectedIds.has(task.id);
              return (
                <button
                  key={task.id}
                  type="button"
                  disabled={used || selectedCount >= total}
                  onClick={() => handleTaskClick(task)}
                  className={`flex items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-sm text-sm text-left transition-colors ${
                    used
                      ? "opacity-50 cursor-not-allowed border-muted"
                      : selectedCount >= total
                        ? "opacity-50 cursor-not-allowed border-muted"
                        : "hover:bg-muted/80 hover:border-primary/30 cursor-pointer"
                  }`}
                >
                  <span className="text-lg shrink-0" aria-hidden="true">
                    {task.icon}
                  </span>
                  <span className="truncate">{task.title}</span>
                  {used && (
                    <span className="ml-auto text-[10px] font-medium uppercase text-muted-foreground shrink-0">
                      Added
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="min-h-[220px] p-3 bg-background border-2 border-border flex flex-col [grid-area:rank-c]">
          <div className="flex flex-col gap-2 flex-1">
            {Array.from({ length: total }, (_, index) => {
              const rank = index + 1;
              const task = order[index] ?? null;
              return (
                <div
                  key={rank}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm bg-muted/40"
                >
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-xs font-semibold text-primary shrink-0">
                    {rank}
                  </div>
                  {task ? (
                    <>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg shrink-0" aria-hidden="true">
                          {task.icon}
                        </span>
                        <span className="truncate">{task.title}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveAt(index)}
                        aria-label={`Remove "${task.title}" from ranking`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground flex-1">
                      Click a task to fill this slot
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Tasks are added to rank 1, then 2, and so on. Remove a rank or use Clear to change your order.
          </p>
        </Card>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {selectedCount} of {total} selected
        </span>
        {selectedCount === total && (
          <span className="text-xs font-medium text-emerald-600">Ranking complete.</span>
        )}
      </div>
    </div>
  );
}

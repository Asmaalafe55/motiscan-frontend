"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PrioritySortData, PrioritySortTracking, PrioritySortTask } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PrioritySortExerciseProps {
  instructions: string;
  data: PrioritySortData;
  /** Serialized answer value stored in the form (e.g. JSON or joined titles) */
  value: string;
  onChange: (value: string) => void;
  onTrackingUpdate: (tracking: PrioritySortTracking) => void;
}

type SlotId = string; // "slot-0" .. "slot-5"

interface InternalState {
  // Cards that are still in the left pool
  pool: PrioritySortTask[];
  // Mapping slotId -> task or null
  slots: Record<SlotId, PrioritySortTask | null>;
}

const buildInitialState = (tasks: PrioritySortTask[], slotCount: number): InternalState => {
  const shuffled = [...tasks].sort(() => Math.random() - 0.5);
  const slots: Record<SlotId, PrioritySortTask | null> = {};
  for (let i = 0; i < slotCount; i += 1) {
    slots[`slot-${i}`] = null;
  }
  return { pool: shuffled, slots };
};

const serializeAnswer = (slots: Record<SlotId, PrioritySortTask | null>): string => {
  const ordered = Object.keys(slots)
    .sort((a, b) => {
      const ia = parseInt(a.split("-")[1] ?? "0", 10);
      const ib = parseInt(b.split("-")[1] ?? "0", 10);
      return ia - ib;
    })
    .map((key) => slots[key])
    .filter((t): t is PrioritySortTask => !!t)
    .map((t) => t.title);
  return ordered.join(" | ");
};

export function PrioritySortExercise({
  instructions,
  data,
  value,
  onChange,
  onTrackingUpdate,
}: PrioritySortExerciseProps) {
  const slotCount = Math.min(Math.max(data.tasks.length, 5), 6);

  const mountedAt = useRef<number>(Date.now());
  const firstMoveAt = useRef<number | null>(null);
  const placedOnceRef = useRef<Set<string>>(new Set());

  const [state, setState] = useState<InternalState>(() =>
    buildInitialState(data.tasks, slotCount)
  );

  const [tracking, setTracking] = useState<PrioritySortTracking>({
    final_order: [],
    time_to_first_move: undefined,
    total_moves: 0,
    reorder_count: 0,
    time_spent_seconds: 0,
    skipped: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    })
  );

  // Derived helpers
  const filledCount = useMemo(
    () => Object.values(state.slots).filter(Boolean).length,
    [state.slots]
  );
  const allFilled = filledCount === slotCount;

  const recomputeTracking = useCallback(
    (partial?: Partial<PrioritySortTracking>): PrioritySortTracking => {
      const now = Date.now();
      const orderTitles = Object.keys(state.slots)
        .sort((a, b) => {
          const ia = parseInt(a.split("-")[1] ?? "0", 10);
          const ib = parseInt(b.split("-")[1] ?? "0", 10);
          return ia - ib;
        })
        .map((key) => state.slots[key])
        .filter((t): t is PrioritySortTask => !!t)
        .map((t) => t.title);

      const base: PrioritySortTracking = {
        ...tracking,
        final_order: orderTitles,
        time_spent_seconds: Math.floor((now - mountedAt.current) / 1000),
        skipped: orderTitles.length < slotCount,
      };

      if (firstMoveAt.current && base.time_to_first_move === undefined) {
        base.time_to_first_move = Math.floor(
          (firstMoveAt.current - mountedAt.current) / 1000
        );
      }

      return { ...base, ...(partial ?? {}) };
    },
    [state.slots, tracking, slotCount]
  );

  const updateTracking = useCallback(
    (patch?: Partial<PrioritySortTracking>) => {
      setTracking((prev) => {
        const next = recomputeTracking(patch ?? {});
        return next;
      });
    },
    [recomputeTracking]
  );

  // Propagate tracking changes to parent, skipping first render
  const isFirstRender = useRef(true);
  const prevTrackingRef = useRef(tracking);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (prevTrackingRef.current !== tracking) {
      prevTrackingRef.current = tracking;
      onTrackingUpdate(tracking);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking]);

  // Keep time_spent_seconds fresh every second while mounted
  useEffect(() => {
    const id = setInterval(() => {
      setTracking((prev) => {
        const now = Date.now();
        return {
          ...prev,
          time_spent_seconds: Math.floor((now - mountedAt.current) / 1000),
        };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleClear = () => {
    setState(buildInitialState(data.tasks, slotCount));
    placedOnceRef.current = new Set();
    firstMoveAt.current = null;
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // If dropping onto the same place, ignore
    if (activeId === overId) return;

    const isPoolCard = activeId.startsWith("task-");
    const isSlot = overId.startsWith("slot-");

    if (!isSlot) return;

    setState((prev) => {
      const next: InternalState = {
        pool: [...prev.pool],
        slots: { ...prev.slots },
      };

      let moved = false;

      const findTaskById = (id: string): PrioritySortTask | undefined => {
        const inPool = next.pool.find((t) => t.id === id);
        if (inPool) return inPool;
        const inSlots = Object.values(next.slots).find((t) => t && t.id === id);
        return inSlots ?? undefined;
      };

      const targetSlotId = overId as SlotId;
      const existingInTarget = next.slots[targetSlotId];

      if (isPoolCard) {
        const taskId = activeId.replace("task-", "");
        const task = findTaskById(taskId);
        if (!task) return prev;

        // Remove from pool
        next.pool = next.pool.filter((t) => t.id !== taskId);

        // If there was a card in this slot, move it back to pool
        if (existingInTarget) {
          next.pool.push(existingInTarget);
        }

        next.slots[targetSlotId] = task;
        moved = true;
      } else if (activeId.startsWith("slot-")) {
        const sourceSlotId = activeId as SlotId;
        if (!next.slots[sourceSlotId]) return prev;

        // Moving between slots
        if (sourceSlotId === targetSlotId) return prev;

        const sourceTask = next.slots[sourceSlotId];
        next.slots[sourceSlotId] = existingInTarget ?? null;
        next.slots[targetSlotId] = sourceTask;
        moved = true;
      }

      if (!moved) return prev;

      if (!firstMoveAt.current) {
        firstMoveAt.current = Date.now();
      }

      const currentOrderTitles = Object.keys(next.slots)
        .sort((a, b) => {
          const ia = parseInt(a.split("-")[1] ?? "0", 10);
          const ib = parseInt(b.split("-")[1] ?? "0", 10);
          return ia - ib;
        })
        .map((key) => next.slots[key])
        .filter((t): t is PrioritySortTask => !!t)
        .map((t) => t.title);

      // Determine reorder_count increment
      const movedTask =
        isPoolCard && activeId.startsWith("task-")
          ? findTaskById(activeId.replace("task-", ""))
          : activeId.startsWith("slot-")
          ? prev.slots[activeId as SlotId]
          : undefined;

      setTracking((prevTracking) => {
        let reorderIncrement = 0;
        if (movedTask) {
          const placedOnce = placedOnceRef.current;
          if (placedOnce.has(movedTask.id)) {
            reorderIncrement = 1;
          } else {
            placedOnce.add(movedTask.id);
          }
        }

        const now = Date.now();
        const nextTracking: PrioritySortTracking = {
          ...prevTracking,
          final_order: currentOrderTitles,
          total_moves: prevTracking.total_moves + 1,
          reorder_count: prevTracking.reorder_count + reorderIncrement,
          time_spent_seconds: Math.floor((now - mountedAt.current) / 1000),
          skipped: currentOrderTitles.length < slotCount,
        };

        if (firstMoveAt.current && nextTracking.time_to_first_move === undefined) {
          nextTracking.time_to_first_move = Math.floor(
            (firstMoveAt.current - mountedAt.current) / 1000
          );
        }

        return nextTracking;
      });

      // Update the stored answer
      const serialized = serializeAnswer(next.slots);
      onChange(serialized);

      return next;
    });
  };

  // Keep parent answer in sync if value changes from outside (unlikely, but safe)
  useEffect(() => {
    // No-op for now; the canonical state lives here and is pushed up via onChange.
  }, [value]);

  const poolTasks = state.pool;
  const slotIds = useMemo(
    () => Object.keys(state.slots).sort((a, b) => {
      const ia = parseInt(a.split("-")[1] ?? "0", 10);
      const ib = parseInt(b.split("-")[1] ?? "0", 10);
      return ia - ib;
    }),
    [state.slots]
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      <p className="text-base leading-relaxed text-foreground">{instructions}</p>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pool column */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Task Pool
            </h3>
            <Card className="min-h-[220px] p-3 flex flex-col gap-2 bg-muted/50 border-dashed border-2 border-border">
              {poolTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center mt-8">
                  All tasks have been placed in the ranking.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {poolTasks.map((task) => (
                    <DraggableTaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Ranking slots column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Ranked Order
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="text-xs"
              >
                Clear
              </Button>
            </div>
            <Card className="min-h-[220px] p-3 bg-background border-2 border-border">
              <SortableContext items={slotIds} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {slotIds.map((slotId, index) => (
                    <SortableSlot
                      key={slotId}
                      id={slotId}
                      rank={index + 1}
                      task={state.slots[slotId]}
                    />
                  ))}
                </div>
              </SortableContext>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Drag tasks from the pool into the numbered slots. 1 is the most important.
              </p>
            </Card>
          </div>
        </div>
      </DndContext>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">
          {filledCount} of {slotCount} slots filled
        </span>
        {allFilled && (
          <span className="text-xs font-medium text-emerald-600">
            All slots filled — ranking complete.
          </span>
        )}
      </div>
    </div>
  );
}

interface DraggableTaskCardProps {
  task: PrioritySortTask;
}

function DraggableTaskCard({ task }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `task-${task.id}`,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-sm text-sm"
    >
      <span className="text-lg" aria-hidden="true">
        {task.icon}
      </span>
      <span className="truncate">{task.title}</span>
    </div>
  );
}

interface SortableSlotProps {
  id: SlotId;
  rank: number;
  task: PrioritySortTask | null;
}

function SortableSlot({ id, rank, task }: SortableSlotProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: task ? "grab" : "default",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(task ? { ...attributes, ...listeners } : {})}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm bg-muted/40 ${
        isDragging ? "ring-2 ring-ring" : ""
      }`}
    >
      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {rank}
      </div>
      {task ? (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg" aria-hidden="true">
            {task.icon}
          </span>
          <span className="truncate">{task.title}</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">Drop a task here</span>
      )}
    </div>
  );
}


"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AnalyticalPerceptionConfig,
  AnalyticalPerceptionTracking,
  PerceptionItemTracking,
} from "@/types";
import { PerceptionGrid } from "./analytical/PerceptionGrid";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AnalyticalPerceptionExerciseProps {
  instructions: string;
  config: AnalyticalPerceptionConfig;
  /** Called when tracking data changes — uses isFirstRender + prevTrackingRef to prevent infinite loops */
  onTrackingUpdate: (tracking: AnalyticalPerceptionTracking) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnalyticalPerceptionExercise({
  instructions,
  config,
  onTrackingUpdate,
}: AnalyticalPerceptionExerciseProps) {
  // answers[cellLabel] = selected number | null
  const [answers, setAnswers] = useState<Record<string, number | null>>(() => {
    const init: Record<string, number | null> = {};
    for (const cell of config.cells) init[cell.cell_label] = null;
    return init;
  });

  // Previous answer values to detect changes
  const prevAnswersRef = useRef<Record<string, number | null>>({});
  // answerChanged flags per cell
  const answerChangedRef = useRef<Record<string, boolean>>({});
  // Per-cell time spent in seconds
  const cellTimeRef = useRef<Record<string, number>>({});
  // Exercise started timestamp
  const startedAtRef = useRef(new Date().toISOString());

  // ---------------------------------------------------------------------------
  // Build full tracking payload
  // ---------------------------------------------------------------------------

  const buildTracking = useCallback((): AnalyticalPerceptionTracking => {
    const items: PerceptionItemTracking[] = config.cells.map((cell) => {
      const studentAnswer = answers[cell.cell_label] ?? null;
      const isCorrect = studentAnswer !== null && studentAnswer === cell.correct_answer;
      return {
        cell_label: cell.cell_label,
        correct_answer: cell.correct_answer,
        student_answer: studentAnswer,
        is_correct: isCorrect,
        time_spent_seconds: cellTimeRef.current[cell.cell_label] ?? 0,
        answer_changed: answerChangedRef.current[cell.cell_label] ?? false,
        skipped: studentAnswer === null,
      };
    });

    const answeredItems = items.filter((i) => !i.skipped);
    const totalCorrect = items.filter((i) => i.is_correct).length;
    const totalSkipped = items.filter((i) => i.skipped).length;
    const totalItems = items.length;
    const accuracyPct = totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0;
    const totalTime = Math.floor(
      (Date.now() - new Date(startedAtRef.current).getTime()) / 1000
    );
    const avgTimePerItem =
      answeredItems.length > 0
        ? Math.round(
            answeredItems.reduce((s, i) => s + i.time_spent_seconds, 0) / answeredItems.length
          )
        : 0;
    const itemsAnsweredChanged = items.filter((i) => i.answer_changed).length;

    return {
      items,
      time_started: startedAtRef.current,
      total_time_seconds: totalTime,
      total_correct: totalCorrect,
      total_skipped: totalSkipped,
      accuracy_percentage: accuracyPct,
      avg_time_per_item_seconds: avgTimePerItem,
      items_answered_changed: itemsAnsweredChanged,
    };
  }, [answers, config.cells]);

  // ---------------------------------------------------------------------------
  // Tracking propagation — isFirstRender + prevTrackingRef pattern
  // prevents infinite loops (same fix as DifferencesExercise)
  // ---------------------------------------------------------------------------

  const isFirstRender = useRef(true);
  const prevTrackingRef = useRef<AnalyticalPerceptionTracking | null>(null);

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
    // onTrackingUpdate intentionally excluded to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  // ---------------------------------------------------------------------------
  // Answer change handler
  // ---------------------------------------------------------------------------

  const handleAnswerChange = useCallback((cellLabel: string, value: number) => {
    setAnswers((prev) => {
      const hadPrev = prev[cellLabel] !== null && prev[cellLabel] !== undefined;
      if (hadPrev) {
        answerChangedRef.current[cellLabel] = true;
      }
      prevAnswersRef.current[cellLabel] = prev[cellLabel];
      return { ...prev, [cellLabel]: value };
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Per-cell time tracking
  // ---------------------------------------------------------------------------

  const handleCellTimeUpdate = useCallback((cellLabel: string, seconds: number) => {
    cellTimeRef.current[cellLabel] = seconds;
  }, []);

  // ---------------------------------------------------------------------------
  // Answered count for progress indicator
  // ---------------------------------------------------------------------------

  const answeredCount = Object.values(answers).filter((v) => v !== null).length;
  const totalCount = config.cells.length;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Instructions */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <span className="text-blue-500 text-lg leading-none mt-0.5 flex-shrink-0">ℹ</span>
        <p className="text-sm leading-relaxed text-blue-900 font-medium">{instructions}</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-gray-100">
          <div
            className="h-1.5 rounded-full bg-indigo-500 transition-all"
            style={{ width: `${(answeredCount / totalCount) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {answeredCount} / {totalCount} answered
        </span>
      </div>

      {/* Grid */}
      <PerceptionGrid
        config={config}
        answers={answers}
        onAnswerChange={handleAnswerChange}
        onCellTimeUpdate={handleCellTimeUpdate}
      />

      {/* Legend */}
      <div className="flex items-center gap-4 justify-center pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded-sm border-2 border-indigo-400 bg-white" />
          <span className="text-xs text-muted-foreground">Section shape (blue) — count occurrences in design</span>
        </div>
      </div>
    </div>
  );
}

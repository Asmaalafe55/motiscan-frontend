"use client";

import { useEffect, useRef, useState } from "react";
import { DifferenceImages, DifferencesTracking, DifferenceObject } from "@/types";
import { Button } from "@/components/ui/button";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { cn } from "@/lib/utils";

interface DifferencesExerciseProps {
  /** The instruction text shown above the images */
  instructions: string;
  /** The two images to compare */
  images: DifferenceImages;
  /** Objects the student needs to classify */
  differenceObjects: DifferenceObject[];
  /**
   * Controlled answer value — JSON-serialised Record<objectId, string[]>.
   * An absent key (or empty array) means "no change selected" for that object.
   */
  value: string;
  /** Called whenever the student's selections change */
  onChange: (value: string) => void;
  /** Called whenever tracking metrics are updated */
  onTrackingUpdate: (tracking: DifferencesTracking) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseSelections(v: string): Record<string, string[]> {
  try {
    const parsed = JSON.parse(v);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string[]>;
    }
  } catch {
    // ignore
  }
  return {};
}

/** Order-insensitive array equality */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DifferencesExercise({
  instructions,
  images,
  differenceObjects,
  value,
  onChange,
  onTrackingUpdate,
}: DifferencesExerciseProps) {
  const mountedAt = useRef<number>(Date.now());

  // Lazy-initialise from serialised value so navigating back restores selections.
  // Selections: objectId → string[] (multi-select; absent = no selection = "no change")
  const [selections, setSelections] = useState<Record<string, string[]>>(() =>
    parseSelections(value)
  );
  const [submitted, setSubmitted] = useState(false);
  const lastEmittedValue = useRef(value);

  // Hydrate when parent restores a saved answer (e.g. student reopens the exam).
  useEffect(() => {
    if (value === lastEmittedValue.current) return;
    lastEmittedValue.current = value;
    setSelections(parseSelections(value));
  }, [value]);

  const totalObjects = differenceObjects.length;
  // "Answered" = student made at least one selection for that row
  const answeredCount = Object.values(selections).filter((v) => v.length > 0).length;

  // Keep a stable ref so the unmount cleanup can read the latest tracking
  const trackingRef = useRef<DifferencesTracking>({
    objects_classified: answeredCount,
    total_objects: totalObjects,
    time_to_first_click: undefined,
    time_spent_seconds: 0,
    skipped: answeredCount === 0,
    revisited: false,
  });

  // ---------------------------------------------------------------------------
  // Toggle a single change-type for an object (multi-select)
  // ---------------------------------------------------------------------------

  const handleToggle = (objectId: string, changeType: string) => {
    if (submitted) return;

    // Compute the next state synchronously from the current snapshot so we
    // can call onTrackingUpdate / onChange OUTSIDE the setState updater.
    // Calling parent setters inside a functional updater triggers React's
    // "cannot update during render" warning.
    const current = selections[objectId] ?? [];
    const has = current.includes(changeType);
    const newList = has
      ? current.filter((c) => c !== changeType)
      : [...current, changeType];

    const updated: Record<string, string[]> = { ...selections };
    if (newList.length === 0) {
      delete updated[objectId];
    } else {
      updated[objectId] = newList;
    }

    const newAnswered = Object.values(updated).filter((v) => v.length > 0).length;
    const timeSpentSeconds = Math.floor((Date.now() - mountedAt.current) / 1000);
    const isFirstClick =
      trackingRef.current.time_to_first_click === undefined && newAnswered > 0;

    const newTracking: DifferencesTracking = {
      ...trackingRef.current,
      objects_classified: newAnswered,
      total_objects: totalObjects,
      time_to_first_click: isFirstClick
        ? Date.now() - mountedAt.current
        : trackingRef.current.time_to_first_click,
      time_spent_seconds: timeSpentSeconds,
      skipped: newAnswered === 0,
    };
    trackingRef.current = newTracking;

    setSelections(updated);
    onTrackingUpdate(newTracking);
    const serialized = JSON.stringify(updated);
    lastEmittedValue.current = serialized;
    onChange(serialized);
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmitAnswers = () => {
    const correctCount = differenceObjects.filter((obj) =>
      arraysEqual(selections[obj.id] ?? [], obj.correctAnswers)
    ).length;

    const score = totalObjects > 0 ? correctCount / totalObjects : 0;
    const timeSpentSeconds = Math.floor((Date.now() - mountedAt.current) / 1000);

    const finalTracking: DifferencesTracking = {
      ...trackingRef.current,
      time_spent_seconds: timeSpentSeconds,
      skipped: answeredCount === 0,
      score,
      total_correct: correctCount,
    };
    trackingRef.current = finalTracking;
    onTrackingUpdate(finalTracking);
    setSubmitted(true);
  };

  // Finalise time_spent on unmount
  useEffect(() => {
    return () => {
      const timeSpentSeconds = Math.floor((Date.now() - mountedAt.current) / 1000);
      onTrackingUpdate({ ...trackingRef.current, time_spent_seconds: timeSpentSeconds });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const correctCount = submitted
    ? differenceObjects.filter((obj) =>
        arraysEqual(selections[obj.id] ?? [], obj.correctAnswers)
      ).length
    : 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Instructions */}
      <p className="text-base leading-relaxed text-foreground">{instructions}</p>

      {/* Two images side by side */}
      <div className="grid grid-cols-2 gap-4">
        {(
          [
            { url: images.image1Url, label: "Image 1" },
            { url: images.image2Url, label: "Image 2" },
          ] as const
        ).map(({ url, label }) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveMediaUrl(url)}
              alt={label}
              className="w-full rounded-lg border-2 border-border object-contain bg-muted"
              style={{ aspectRatio: "4/3", maxHeight: 280 }}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      {totalObjects > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              {answeredCount} of {totalObjects} object{totalObjects !== 1 ? "s" : ""} answered
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                — leave blank if an object has no change
              </span>
            </span>
            {submitted && (
              <span
                className={cn(
                  "font-semibold",
                  correctCount === totalObjects ? "text-green-600" : "text-foreground"
                )}
              >
                Score: {correctCount}/{totalObjects}
              </span>
            )}
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
              style={{
                width: `${totalObjects > 0 ? (answeredCount / totalObjects) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Object rows */}
      {totalObjects === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No objects have been defined for this exercise yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {differenceObjects.map((obj) => {
            const selected = selections[obj.id] ?? [];
            const isAnswered = selected.length > 0;
            const isCorrect = submitted
              ? arraysEqual(selected, obj.correctAnswers)
              : null;

            return (
              <div
                key={obj.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors",
                  submitted && isCorrect === true && "border-green-500 bg-green-50",
                  submitted && isCorrect === false && "border-red-400 bg-red-50",
                  !submitted && isAnswered && "border-blue-400",
                  !submitted && !isAnswered && "border-border"
                )}
              >
                {/* Object name */}
                <span className="text-sm font-medium text-foreground min-w-[4.5rem] flex-shrink-0">
                  {obj.name}
                </span>

                {/* Vertical divider */}
                <div className="h-8 w-px bg-border flex-shrink-0" />

                {/* Change-type buttons — multi-select, all visible */}
                <div className="flex flex-wrap gap-2 flex-1">
                  {obj.changeOptions.map((ct) => {
                    const isSelected = selected.includes(ct);
                    const isCorrectOption = submitted && obj.correctAnswers.includes(ct);

                    return (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => handleToggle(obj.id, ct)}
                        disabled={submitted}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors select-none",
                          // Selected + not yet submitted → blue
                          isSelected && !submitted && "bg-blue-600 text-white border-blue-600",
                          // Selected + submitted + correct → green
                          isSelected &&
                            submitted &&
                            isCorrect === true &&
                            "bg-green-600 text-white border-green-600",
                          // Selected + submitted + this row incorrect → red
                          isSelected &&
                            submitted &&
                            isCorrect === false &&
                            "bg-red-500 text-white border-red-500",
                          // Not selected + submitted + IS a correct answer for this row → ring hint
                          !isSelected &&
                            isCorrectOption &&
                            "ring-2 ring-green-500 border-green-400 bg-green-50 text-green-800",
                          // Default unselected
                          !isSelected &&
                            !isCorrectOption &&
                            "bg-background border-border text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                        )}
                      >
                        {ct}
                      </button>
                    );
                  })}
                </div>

                {/* Post-submit hint for incorrect rows */}
                {submitted && isCorrect === false && (
                  <span className="text-xs font-medium text-green-700 flex-shrink-0 whitespace-nowrap ml-1">
                    {obj.correctAnswers.length === 0
                      ? "✓ No change"
                      : `✓ ${obj.correctAnswers.join(", ")}`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit button */}
      {totalObjects > 0 && !submitted && (
        <div className="flex justify-end pt-2">
          <Button type="button" variant="gradient" onClick={handleSubmitAnswers}>
            Submit answers
          </Button>
        </div>
      )}

      {/* Result banner */}
      {submitted && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium",
            correctCount === totalObjects
              ? "border-green-400 bg-green-50 text-green-800"
              : "border-border bg-muted text-foreground"
          )}
        >
          {correctCount === totalObjects ? "🎉 " : ""}
          You got {correctCount} out of {totalObjects} correct.
          {correctCount < totalObjects &&
            " Incorrect rows are highlighted in red above."}
        </div>
      )}
    </div>
  );
}

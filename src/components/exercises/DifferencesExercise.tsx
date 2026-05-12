"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { DifferenceImages, DifferencesTracking } from "@/types";

interface DifferencesExerciseProps {
  /** The instruction text shown above the images */
  instructions: string;
  /** The two images to compare */
  images: DifferenceImages;
  /** Controlled answer value (the student's text) */
  value: string;
  /** Called whenever the student's text changes */
  onChange: (value: string) => void;
  /** Called whenever tracking metrics are updated */
  onTrackingUpdate: (tracking: DifferencesTracking) => void;
}

export function DifferencesExercise({
  instructions,
  images,
  value,
  onChange,
  onTrackingUpdate,
}: DifferencesExerciseProps) {
  // Moment the component mounted — used to compute time-to-first-keystroke
  const mountedAt = useRef<number>(Date.now());

  // Internal tracking state (not in parent form — stored separately and reported up)
  const [tracking, setTracking] = useState<DifferencesTracking>({
    characters_typed: value.length,
    time_to_first_keystroke: undefined,
    edits_count: 0,
    time_spent_seconds: 0,
    skipped: value.length === 0,
    revisited: false,
  });

  // Previous text length used to detect deletions (edits)
  const prevLengthRef = useRef<number>(value.length);

  const updateTracking = useCallback((patch: Partial<DifferencesTracking>) => {
    setTracking((prev) => ({ ...prev, ...patch }));
  }, []);

  // Sync character count whenever value changes from the outside
  useEffect(() => {
    updateTracking({
      characters_typed: value.length,
      skipped: value.length === 0,
    });
  }, [value, updateTracking]);

  // Propagate tracking changes to the parent only when the value genuinely changes,
  // skipping the initial render to avoid triggering a state update during render.
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
    // onTrackingUpdate is intentionally excluded — adding it would recreate
    // this effect on every parent render and restart the loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const newLen = newText.length;
    const prevLen = prevLengthRef.current;
    const timeSpentSeconds = Math.floor((Date.now() - mountedAt.current) / 1000);

    setTracking((prev) => {
      const isFirstKeystroke = prev.time_to_first_keystroke === undefined && newLen > 0;
      const isEdit = newLen < prevLen; // deletion / backspace

      return {
        ...prev,
        characters_typed: newLen,
        time_to_first_keystroke: isFirstKeystroke
          ? Date.now() - mountedAt.current
          : prev.time_to_first_keystroke,
        edits_count: isEdit ? prev.edits_count + 1 : prev.edits_count,
        time_spent_seconds: timeSpentSeconds,
        skipped: newLen === 0,
      };
    });

    prevLengthRef.current = newLen;
    onChange(newText);
  };

  // On unmount, finalize time_spent_seconds and mark skipped when empty
  useEffect(() => {
    return () => {
      const timeSpentSeconds = Math.floor((Date.now() - mountedAt.current) / 1000);
      onTrackingUpdate({
        ...tracking,
        time_spent_seconds: timeSpentSeconds,
        skipped: tracking.characters_typed === 0,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              src={url}
              alt={label}
              className="w-full rounded-lg border-2 border-border object-contain bg-muted"
              style={{ aspectRatio: "4/3", maxHeight: 280 }}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Answer area */}
      <div className="flex flex-col gap-2">
        <textarea
          value={value}
          onChange={handleChange}
          placeholder="Write the differences you found here..."
          rows={5}
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y transition"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {tracking.characters_typed} character{tracking.characters_typed !== 1 ? "s" : ""}
          </span>
          {tracking.edits_count > 0 && (
            <span className="text-xs text-muted-foreground">
              {tracking.edits_count} edit{tracking.edits_count !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

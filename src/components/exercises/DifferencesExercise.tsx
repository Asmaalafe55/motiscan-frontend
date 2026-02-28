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
    charactersTyped: value.length,
    timeToFirstKeystroke: undefined,
    editsCount: 0,
    finalAnswerText: value,
  });

  // Previous text length used to detect deletions (edits)
  const prevLengthRef = useRef<number>(value.length);

  const updateTracking = useCallback(
    (patch: Partial<DifferencesTracking>) => {
      setTracking((prev) => {
        const next = { ...prev, ...patch };
        onTrackingUpdate(next);
        return next;
      });
    },
    [onTrackingUpdate]
  );

  // Sync character count + finalAnswerText whenever value changes from the outside
  useEffect(() => {
    updateTracking({ charactersTyped: value.length, finalAnswerText: value });
  }, [value, updateTracking]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const newLen = newText.length;
    const prevLen = prevLengthRef.current;

    setTracking((prev) => {
      const isFirstKeystroke = prev.timeToFirstKeystroke === undefined && newLen > 0;
      const isEdit = newLen < prevLen; // deletion / backspace

      const next: DifferencesTracking = {
        ...prev,
        charactersTyped: newLen,
        timeToFirstKeystroke: isFirstKeystroke
          ? Date.now() - mountedAt.current
          : prev.timeToFirstKeystroke,
        editsCount: isEdit ? prev.editsCount + 1 : prev.editsCount,
        finalAnswerText: newText,
      };
      onTrackingUpdate(next);
      return next;
    });

    prevLengthRef.current = newLen;
    onChange(newText);
  };

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
            {tracking.charactersTyped} character{tracking.charactersTyped !== 1 ? "s" : ""}
          </span>
          {tracking.editsCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {tracking.editsCount} edit{tracking.editsCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

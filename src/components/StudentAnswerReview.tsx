"use client";

import type { ReactNode } from "react";
import type { Answer, Question } from "@/types";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { NO_CHANGE_VALUE } from "@/components/exercises/DifferencesExercise";

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function tryParseJson(value: unknown): unknown {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return null;

  // JSON objects / arrays
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

function isEmptyAnswer(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value === "string") {
    const t = value.trim();
    return t === "" || t === "{}" || t === "[]";
  }
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as object).length === 0;
  return false;
}

// ---------------------------------------------------------------------------
// Exercise context (images / diagrams as the student saw them)
// ---------------------------------------------------------------------------

function DifferencesContext({ question }: { question: Question }) {
  const images = question.differenceImages;
  if (!images?.image1Url && !images?.image2Url) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {(
        [
          { url: images.image1Url, label: "Image 1" },
          { url: images.image2Url, label: "Image 2" },
        ] as const
      ).map(({ url, label }) =>
        url ? (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveMediaUrl(url)}
              alt={label}
              className="w-full rounded-lg border bg-muted object-contain"
              style={{ aspectRatio: "4/3", maxHeight: 200 }}
              draggable={false}
            />
          </div>
        ) : null
      )}
    </div>
  );
}

function ShapeCopyContext({ question }: { question: Question }) {
  const rows = question.shapeCopyConfig?.rows ?? [];
  if (rows.length === 0) return null;

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.row_number} className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Model — Row {row.row_number}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveMediaUrl(row.model_snapshot)}
            alt={`Shape model row ${row.row_number}`}
            className="w-full max-h-40 rounded-lg border bg-white object-contain p-2"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}

function AnalyticalPerceptionContext({ question }: { question: Question }) {
  const cells = question.analyticalPerceptionConfig?.cells ?? [];
  if (cells.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {cells.map((cell) => {
        const src = cell.design_svg || cell.section_svg;
        if (!src) return null;
        return (
          <div key={cell.cell_label} className="rounded-lg border bg-white p-2 space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground text-center">
              {cell.cell_label}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveMediaUrl(src)}
              alt={`Cell ${cell.cell_label}`}
              className="w-full h-20 object-contain"
              draggable={false}
            />
          </div>
        );
      })}
    </div>
  );
}

function ExerciseContext({ question }: { question: Question }) {
  if (question.type === "differences" && question.differenceImages) {
    return <DifferencesContext question={question} />;
  }
  if (question.type === "shape_copy" && question.shapeCopyConfig) {
    return <ShapeCopyContext question={question} />;
  }
  if (question.type === "analytical_perception" && question.analyticalPerceptionConfig) {
    return <AnalyticalPerceptionContext question={question} />;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Friendly answer renderers
// ---------------------------------------------------------------------------

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-800">
      {children}
    </span>
  );
}

function EmptyAnswer() {
  return <p className="text-sm text-muted-foreground italic">No answer submitted</p>;
}

function DifferencesAnswer({
  question,
  parsed,
}: {
  question: Question;
  parsed: unknown;
}) {
  const objects = question.differenceObjects ?? [];
  const nameById = new Map(objects.map((o) => [o.id, o.name]));

  // JSON map: objectId → change types[]
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const selections = parsed as Record<string, unknown>;
    const entries = objects.length > 0
      ? objects.map((obj) => ({
          id: obj.id,
          name: obj.name,
          selected: Array.isArray(selections[obj.id])
            ? (selections[obj.id] as string[])
            : typeof selections[obj.id] === "string"
              ? [selections[obj.id] as string]
              : [],
        }))
      : Object.entries(selections).map(([id, val]) => ({
          id,
          name: nameById.get(id) ?? id,
          selected: Array.isArray(val)
            ? (val as string[])
            : typeof val === "string"
              ? [val]
              : [],
        }));

    if (entries.length === 0) return <EmptyAnswer />;

    return (
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-center gap-2 rounded-md border bg-white px-3 py-2"
          >
            <span className="text-sm font-medium text-gray-800 min-w-[4.5rem]">
              {entry.name}
            </span>
            <span className="h-4 w-px bg-border flex-shrink-0" />
            {entry.selected.includes(NO_CHANGE_VALUE) ? (
              <span className="text-xs text-muted-foreground italic">No change</span>
            ) : entry.selected.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {entry.selected
                  .filter((t) => t !== NO_CHANGE_VALUE)
                  .map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">Not answered</span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  // Legacy plain-text answers (seed data)
  if (typeof parsed === "string" && parsed.trim()) {
    return (
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
        {parsed}
      </p>
    );
  }

  return <EmptyAnswer />;
}

function PrioritySortAnswer({ parsed }: { parsed: unknown }) {
  if (typeof parsed !== "string" || !parsed.trim()) return <EmptyAnswer />;

  const items = parsed
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  if (items.length === 0) return <EmptyAnswer />;

  return (
    <ol className="space-y-2">
      {items.map((title, i) => (
        <li
          key={`${i}-${title}`}
          className="flex items-center gap-3 rounded-md border bg-white px-3 py-2"
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
            {i + 1}
          </span>
          <span className="text-sm text-gray-800">{title}</span>
        </li>
      ))}
    </ol>
  );
}

function AnalyticalPerceptionAnswer({
  question,
  parsed,
}: {
  question: Question;
  parsed: unknown;
}) {
  const cells = question.analyticalPerceptionConfig?.cells ?? [];

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const map = parsed as Record<string, unknown>;
    const labels =
      cells.length > 0 ? cells.map((c) => c.cell_label) : Object.keys(map);

    return (
      <ul className="grid grid-cols-2 gap-2">
        {labels.map((label) => {
          const val = map[label];
          return (
            <li
              key={label}
              className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
            >
              <span className="text-xs font-semibold text-muted-foreground">{label}</span>
              <span className="text-sm font-medium text-gray-800">
                {val === null || val === undefined || val === ""
                  ? "Skipped"
                  : String(val)}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  if (
    typeof parsed === "string" &&
    parsed &&
    parsed !== "analytical_perception_in_progress"
  ) {
    return <p className="text-sm text-gray-800">{parsed}</p>;
  }

  return (
    <p className="text-sm text-muted-foreground italic">
      Cell selections were tracked during the session (no stored answer map).
    </p>
  );
}

function ShapeCopyAnswer({ parsed }: { parsed: unknown }) {
  if (
    typeof parsed === "string" &&
    parsed &&
    parsed !== "drawing_in_progress"
  ) {
    return <p className="text-sm text-gray-800 whitespace-pre-wrap">{parsed}</p>;
  }
  return (
    <p className="text-sm text-muted-foreground italic">
      Student drawings were captured during the session (see model above for exercise context).
    </p>
  );
}

function GenericAnswer({ parsed }: { parsed: unknown }) {
  if (isEmptyAnswer(parsed)) return <EmptyAnswer />;

  if (Array.isArray(parsed)) {
    return (
      <ul className="space-y-1.5">
        {parsed.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
            <span>{typeof item === "object" ? JSON.stringify(item) : String(item)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (parsed && typeof parsed === "object") {
    return (
      <ul className="space-y-2">
        {Object.entries(parsed as Record<string, unknown>).map(([key, val]) => (
          <li
            key={key}
            className="flex flex-wrap items-start gap-2 rounded-md border bg-white px-3 py-2"
          >
            <span className="text-sm font-medium text-gray-800 capitalize">
              {key.replace(/_/g, " ")}
            </span>
            <span className="h-4 w-px bg-border flex-shrink-0 self-center" />
            {Array.isArray(val) ? (
              <div className="flex flex-wrap gap-1.5">
                {val.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">None</span>
                ) : (
                  val.map((t, i) => <Tag key={i}>{String(t)}</Tag>)
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-700">
                {val === null || val === undefined ? "—" : String(val)}
              </span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
      {String(parsed)}
    </p>
  );
}

function FriendlyAnswer({
  question,
  value,
}: {
  question: Question;
  value: unknown;
}) {
  const parsed = tryParseJson(value);

  if (isEmptyAnswer(parsed) && question.type !== "shape_copy" && question.type !== "analytical_perception") {
    return <EmptyAnswer />;
  }

  switch (question.type) {
    case "differences":
      return <DifferencesAnswer question={question} parsed={parsed} />;
    case "priority_sort":
      return <PrioritySortAnswer parsed={parsed} />;
    case "analytical_perception":
      return <AnalyticalPerceptionAnswer question={question} parsed={parsed} />;
    case "shape_copy":
      return <ShapeCopyAnswer parsed={parsed} />;
    default:
      return <GenericAnswer parsed={parsed} />;
  }
}

// ---------------------------------------------------------------------------
// Public card
// ---------------------------------------------------------------------------

interface StudentAnswerReviewProps {
  question: Question;
  answer?: Answer;
  exerciseIndex: number;
  /** Label above the answer content. Defaults to "Student answer". */
  answerLabel?: string;
}

export function StudentAnswerReview({
  question,
  answer,
  exerciseIndex,
  answerLabel = "Student answer",
}: StudentAnswerReviewProps) {
  const typeLabel = question.type.replace(/_/g, " ");

  return (
    <div className="rounded-xl border bg-gray-50 overflow-hidden">
      <div className="px-4 pt-4 pb-2 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Exercise {exerciseIndex + 1}
          </p>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground bg-white border rounded-full px-2 py-0.5">
            {typeLabel}
          </span>
        </div>
        {question.text && (
          <p className="text-sm text-gray-700 leading-snug">{question.text}</p>
        )}
      </div>

      {/* Visual context — same media the student saw */}
      <div className="px-4 pb-3">
        <ExerciseContext question={question} />
      </div>

      {/* Friendly answer */}
      <div className="mx-4 mb-4 rounded-lg border bg-white px-3 py-3">
        <p className="text-xs text-muted-foreground mb-2 font-medium">{answerLabel}</p>
        <FriendlyAnswer question={question} value={answer?.value} />
      </div>
    </div>
  );
}

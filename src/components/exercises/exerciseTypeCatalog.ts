// ---------------------------------------------------------------------------
// Shared catalogue for exercise types (teacher library + type picker)
// ---------------------------------------------------------------------------

export type ExerciseTypeKey =
  | "differences"
  | "shape_copy"
  | "analytical_perception"
  | "priority_sort";

export interface ExerciseTypeInfo {
  key: ExerciseTypeKey;
  label: string;
  description: string;
  measures: string;
  colour: string;
  iconEmoji: string;
  active: boolean;
}

export const EXERCISE_TYPES: ExerciseTypeInfo[] = [
  {
    key: "differences",
    label: "Differences",
    description: "Student finds differences between two images",
    measures: "Attention, focus, visual analysis",
    colour: "border-blue-300 bg-blue-50",
    iconEmoji: "🔍",
    active: true,
  },
  {
    key: "shape_copy",
    label: "Shape Copy",
    description: "Student copies a shape by following rules",
    measures: "Accuracy, rule compliance, confidence",
    colour: "border-orange-300 bg-orange-50",
    iconEmoji: "✏️",
    active: true,
  },
  {
    key: "analytical_perception",
    label: "Analytical Perception",
    description: "Student counts repeated sections in a design",
    measures: "Attention to detail, visual perception",
    colour: "border-indigo-300 bg-indigo-50",
    iconEmoji: "🔢",
    active: true,
  },
  {
    key: "priority_sort",
    label: "Priority Sort",
    description: "Student ranks tasks by importance",
    measures: "Decision making, focus, priorities",
    colour: "border-purple-300 bg-purple-50",
    iconEmoji: "📌",
    active: true,
  },
];

export const OPEN_EXERCISE_TYPES = EXERCISE_TYPES.filter((t) => t.active);

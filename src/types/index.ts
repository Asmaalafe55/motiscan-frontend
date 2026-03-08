export type UserRole = "teacher" | "student";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string; // Only for mock data
  // Optional profile fields (editable by teacher)
  phone?: string;
  grade?: string;
  avatarUrl?: string;
}

export type QuestionType =
  | "multiple_choice"
  | "open_text"
  | "rating_scale"
  | "likert_scale"
  | "differences"
  | "shape_copy"
  | "analytical_perception";

export interface DifferenceImages {
  image1Url: string;
  image2Url: string;
}

// ---------------------------------------------------------------------------
// SHAPE_COPY exercise types (declared before Question so Question can reference them)
// ---------------------------------------------------------------------------

export type ShapeCopyRule = "shape" | "size" | "color" | "number";

export interface DrawnShapeData {
  shape_type: string;       // "rect" | "circle" | "triangle" | "diamond" | "arrow" | "line" | "freehand"
  fill_color: string;
  border_color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  drawn_order: number;
}

/** Tracking payload per figure (A or B) per row */
export interface ShapeCopyFigureTracking {
  row_number: number;
  figure: "A" | "B";
  canvas_snapshot: string;         // base64 image of final canvas
  shapes_data: DrawnShapeData[];
  time_started: string;            // ISO timestamp
  time_first_shape_drawn?: string; // ISO timestamp — engagement indicator
  total_shapes_drawn: number;
  shapes_deleted: number;          // effort/revision indicator
  shapes_moved: number;            // refinement indicator
  undo_count: number;              // confidence indicator
  redo_count: number;
  time_spent_seconds: number;
  required_rules: ShapeCopyRule[];
}

/** Full tracking payload for a SHAPE_COPY exercise */
export interface ShapeCopyTracking {
  figures: ShapeCopyFigureTracking[];
}

/** One row inside a SHAPE_COPY exercise */
export interface ShapeCopyRow {
  row_number: number;
  model_snapshot: string;  // base64 or SVG data URI for the model shape
  figureA_rules: { rule: ShapeCopyRule; required: boolean }[];
  figureB_rules: { rule: ShapeCopyRule; required: boolean }[];
  teacher_notes?: string;  // hidden from student, used as AI context
}

/** Question-level config for SHAPE_COPY exercises */
export interface ShapeCopyConfig {
  rows: ShapeCopyRow[];
}

// ---------------------------------------------------------------------------
// ANALYTICAL_PERCEPTION exercise types
// ---------------------------------------------------------------------------

/** One cell in the perception grid (e.g. A1, B3) */
export interface PerceptionCell {
  cell_label: string;          // e.g. "A1", "B3"
  design_svg: string;          // SVG string for the complex design
  section_svg: string;         // SVG string for the section shape
  correct_answer: number;      // 1-10, teacher-set, never shown to student
  teacher_notes?: string;
}

/** Grid size options */
export type PerceptionGridSize = "2x3" | "2x4" | "3x4";

/** Question-level config for ANALYTICAL_PERCEPTION exercises */
export interface AnalyticalPerceptionConfig {
  grid_size: PerceptionGridSize;  // "2x3" | "2x4" | "3x4"
  cells: PerceptionCell[];
}

/** Per-item tracking for one cell */
export interface PerceptionItemTracking {
  cell_label: string;
  correct_answer: number;
  student_answer: number | null;   // null = skipped
  is_correct: boolean;
  time_spent_seconds: number;
  answer_changed: boolean;
  skipped: boolean;
}

/** Full tracking payload for an ANALYTICAL_PERCEPTION exercise */
export interface AnalyticalPerceptionTracking {
  items: PerceptionItemTracking[];
  time_started: string;
  time_submitted?: string;
  total_time_seconds: number;
  total_correct: number;
  total_skipped: number;
  accuracy_percentage: number;
  avg_time_per_item_seconds: number;
  items_answered_changed: number;
}

// ---------------------------------------------------------------------------

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  text: string;
  options?: string[]; // For multiple choice and likert
  required: boolean;
  order: number;
  // For "differences" type
  differenceImages?: DifferenceImages;
  expectedAnswerNotes?: string; // Teacher-only context for AI
  // For "shape_copy" type
  shapeCopyConfig?: ShapeCopyConfig;
  // For "analytical_perception" type
  analyticalPerceptionConfig?: AnalyticalPerceptionConfig;
}

// AI tracking data specific to the DIFFERENCES exercise type
export interface DifferencesTracking {
  charactersTyped: number;
  timeToFirstKeystroke?: number; // milliseconds from exercise load to first key
  editsCount: number;            // number of deletion/correction events
  finalAnswerText: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName?: string;
  createdAt: string;
  isLive: boolean;
  duration?: number; // in minutes
  questions: Question[];
  /** Ordered list of library exercise IDs this exam was built from */
  exerciseIds?: string[];
  /** Students assigned to this exam */
  assignedStudentIds?: string[];
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  answers: Answer[];
  submittedAt: string;
  timeSpent: number; // in seconds
}

export interface Answer {
  questionId: string;
  value: string | number;
}

export interface MotivationReport {
  id: string;
  studentId: string;
  examId: string;
  submittedAt: string;
  scores: {
    engagement: number; // 0-100
    confidence: number; // 0-100
    persistence: number; // 0-100
    emotionalState: number; // 0-100
  };
  insights: string[];
  recommendations: string[];
}

export interface LiveSession {
  examId: string;
  connectedStudents: string[]; // student IDs
  startedAt: string;
}

// Teacher exercise library
export interface Exercise {
  id: string;
  title: string;
  type: QuestionType;
  instructions: string;
  content?: string;
  tags: string[];
  createdAt: string;
  // Underlying question structure used in exams
  question: Question;
}

export interface ExamTemplate {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  createdAt: string;
  exerciseIds: string[];
}

export type StudentStatus = "online" | "away" | "submitted";

// ---------------------------------------------------------------------------
// Exercise psychological measures
// ---------------------------------------------------------------------------

/** The psychological / cognitive dimensions that exercises can measure. */
export type MeasureDimension =
  | "attention"
  | "analytical_engagement"
  | "analytical_perception"
  | "attention_to_detail"
  | "visual_decomposition"
  | "rule_compliance"
  | "effort"
  | "confidence"
  | "emotional_state"
  | "self_expression_depth"
  | "self_awareness"
  | "honesty_indicators"
  | "cognitive_persistence"
  | "thoroughness"
  | "creativity"
  | "risk_taking";

// Tracking per-exercise attempts
export interface ExerciseAttempt {
  examId: string;
  exerciseId: string;
  questionId: string;
  studentId: string;
  exerciseType: QuestionType;
  timeStarted: string;
  timeFirstAnswer?: string;  // renamed from timeAnswered for clarity
  timeAnswered?: string;     // kept for backward compatibility
  timeLeft?: string;
  durationOnExercise?: number; // in seconds
  answerValue?: string | number;
  answerChanged: boolean;
  skipped: boolean;
  revisited: boolean;
  charactersTyped?: number;
  editsCount?: number;
  timeToFirstKeystroke?: number; // ms from exercise load to first keystroke (differences exercises)
  // Optional exercise-type-specific tracking payload (e.g. DifferencesTracking)
  metadata?: Record<string, unknown>;
}

export interface ExerciseNavigationEvent {
  exerciseId: string;
  exerciseIndex: number;
  timestamp: string;
  action: "enter" | "leave" | "answer" | "submit";
}

export interface StudentExamSession {
  examId: string;
  studentId: string;
  startedAt: string;
  lastActivityAt: string;
  status: StudentStatus;
  currentExerciseIndex: number;
  totalExercises: number;
  timeline: ExerciseNavigationEvent[];
}

export type UserRole = "teacher" | "student";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string; // Only for mock data
}

export type QuestionType =
  | "multiple_choice"
  | "open_text"
  | "rating_scale"
  | "likert_scale"
  | "differences";

export interface DifferenceImages {
  image1Url: string;
  image2Url: string;
}

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

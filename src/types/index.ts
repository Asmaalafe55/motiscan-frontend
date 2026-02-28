export type UserRole = "teacher" | "student";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string; // Only for mock data
}

export type QuestionType = "multiple_choice" | "open_text" | "rating_scale" | "likert_scale";

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  text: string;
  options?: string[]; // For multiple choice and likert
  required: boolean;
  order: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  createdAt: string;
  isLive: boolean;
  duration?: number; // in minutes
  questions: Question[];
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
  timeStarted: string;
  timeAnswered?: string;
  timeLeft?: string;
  durationOnExercise?: number; // in seconds
  answerValue?: string | number;
  answerChanged: boolean;
  skipped: boolean;
  revisited: boolean;
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

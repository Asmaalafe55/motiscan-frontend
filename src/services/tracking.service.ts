import {
  ExerciseAttempt,
  ExerciseNavigationEvent,
  StudentExamSession,
  StudentStatus,
} from "@/types";

// In-memory tracking for mock implementation
const exerciseAttempts: ExerciseAttempt[] = [];

// examId -> (studentId -> session)
const studentSessions: Map<string, Map<string, StudentExamSession>> = new Map();

const MAX_SESSION_MS = 5 * 60 * 60 * 1000; // 5 hours

export const trackingService = {
  startStudentSession: async (
    examId: string,
    studentId: string,
    totalExercises: number,
    startTime: Date
  ): Promise<StudentExamSession> => {
    await new Promise((resolve) => setTimeout(resolve, 50));

    let examSessions = studentSessions.get(examId);
    if (!examSessions) {
      examSessions = new Map();
      studentSessions.set(examId, examSessions);
    }

    const nowIso = startTime.toISOString();
    const existing = examSessions.get(studentId);
    const session: StudentExamSession =
      existing ?? {
        examId,
        studentId,
        startedAt: nowIso,
        lastActivityAt: nowIso,
        status: "online",
        currentExerciseIndex: 0,
        totalExercises,
        timeline: [],
      };

    examSessions.set(studentId, session);
    return session;
  },

  updateStudentSession: async (params: {
    examId: string;
    studentId: string;
    currentExerciseIndex: number;
    totalExercises: number;
    exerciseId: string;
    action: ExerciseNavigationEvent["action"];
  }): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 10));

    let examSessions = studentSessions.get(params.examId);
    if (!examSessions) {
      examSessions = new Map();
      studentSessions.set(params.examId, examSessions);
    }

    const existing = examSessions.get(params.studentId);
    const now = new Date();
    const nowIso = now.toISOString();

    const session: StudentExamSession =
      existing ?? {
        examId: params.examId,
        studentId: params.studentId,
        startedAt: nowIso,
        lastActivityAt: nowIso,
        status: "online",
        currentExerciseIndex: params.currentExerciseIndex,
        totalExercises: params.totalExercises,
        timeline: [],
      };

    session.currentExerciseIndex = params.currentExerciseIndex;
    session.totalExercises = params.totalExercises;
    session.lastActivityAt = nowIso;

    const event: ExerciseNavigationEvent = {
      exerciseId: params.exerciseId,
      exerciseIndex: params.currentExerciseIndex,
      timestamp: nowIso,
      action: params.action,
    };

    session.timeline.push(event);
    examSessions.set(params.studentId, session);
  },

  markSubmitted: async (examId: string, studentId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    const examSessions = studentSessions.get(examId);
    if (!examSessions) return;
    const session = examSessions.get(studentId);
    if (!session) return;
    session.status = "submitted";
    session.lastActivityAt = new Date().toISOString();
    session.timeline.push({
      exerciseId: "",
      exerciseIndex: session.currentExerciseIndex,
      timestamp: session.lastActivityAt,
      action: "submit",
    });
  },

  getStudentSessionsForExam: async (examId: string): Promise<StudentExamSession[]> => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const examSessions = studentSessions.get(examId);
    if (!examSessions) return [];

    const now = Date.now();
    return Array.from(examSessions.values()).map((session) => {
      const startedAtMs = new Date(session.startedAt).getTime();
      const lastActivityMs = new Date(session.lastActivityAt).getTime();
      const elapsed = now - startedAtMs;
      const idle = now - lastActivityMs;

      let status: StudentStatus = session.status;
      if (status !== "submitted") {
        if (elapsed > MAX_SESSION_MS) {
          status = "submitted";
        } else if (idle > 2 * 60 * 1000) {
          status = "away";
        } else {
          status = "online";
        }
      }

      return {
        ...session,
        status,
      };
    });
  },

  recordExerciseAttempts: async (
    attempts: ExerciseAttempt[]
  ): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    exerciseAttempts.push(...attempts);
  },

  getExerciseAttemptsByExam: async (examId: string): Promise<ExerciseAttempt[]> => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return exerciseAttempts.filter((a) => a.examId === examId);
  },
};


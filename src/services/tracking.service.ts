import {
  ExerciseAttempt,
  ExerciseNavigationEvent,
  StudentExamSession,
  StudentStatus,
} from "@/types";

// ---------------------------------------------------------------------------
// Pre-seeded exercise attempts so reports have real data to analyse
// ---------------------------------------------------------------------------
const exerciseAttempts: ExerciseAttempt[] = [
  // student1 — exam1 (Math Assessment)
  {
    examId: "exam1", exerciseId: "q1", questionId: "q1",
    studentId: "student1", exerciseType: "multiple_choice",
    timeStarted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    timeAnswered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 45000).toISOString(),
    timeLeft:    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 90000).toISOString(),
    durationOnExercise: 90,
    answerValue: "x = 4", answerChanged: false, skipped: false, revisited: false,
  },
  {
    examId: "exam1", exerciseId: "q2", questionId: "q2",
    studentId: "student1", exerciseType: "open_text",
    timeStarted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 90000).toISOString(),
    timeAnswered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 300000).toISOString(),
    timeLeft:    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 420000).toISOString(),
    durationOnExercise: 330, charactersTyped: 68, editsCount: 2,
    answerValue: "I would add 7 to both sides, then divide by 3",
    answerChanged: true, skipped: false, revisited: false,
    timeToFirstKeystroke: 2800,
  },
  {
    examId: "exam1", exerciseId: "q3", questionId: "q3",
    studentId: "student1", exerciseType: "rating_scale",
    timeStarted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 420000).toISOString(),
    timeAnswered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 450000).toISOString(),
    timeLeft:    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 510000).toISOString(),
    durationOnExercise: 90, answerValue: 8,
    answerChanged: false, skipped: false, revisited: false,
  },
  {
    examId: "exam1", exerciseId: "q4", questionId: "q4",
    studentId: "student1", exerciseType: "likert_scale",
    timeStarted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 510000).toISOString(),
    timeAnswered: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 540000).toISOString(),
    timeLeft:    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 600000).toISOString(),
    durationOnExercise: 90, answerValue: "Agree",
    answerChanged: false, skipped: false, revisited: true,
  },
];

// examId -> (studentId -> session)
const studentSessions: Map<string, Map<string, StudentExamSession>> = new Map();

const MAX_SESSION_MS = 5 * 60 * 60 * 1000; // 5 hours

// ---------------------------------------------------------------------------
// Pre-seed mock sessions for examA (Group A live exam)
// Sara: online, on exercise 2 of 2, entered 45 min ago
// Ahmed: away (last activity 20 min ago), completed exercise 1 of 2
// ---------------------------------------------------------------------------
const saraStarted   = new Date(Date.now() - 45 * 60 * 1000).toISOString();
const ahmedStarted  = new Date(Date.now() - 65 * 60 * 1000).toISOString();
const ahmedLastSeen = new Date(Date.now() - 20 * 60 * 1000).toISOString();

const examASessions = new Map<string, StudentExamSession>([
  [
    "sara",
    {
      examId: "examA",
      studentId: "sara",
      startedAt: saraStarted,
      lastActivityAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 min ago
      status: "online",
      currentExerciseIndex: 1, // on exercise 2 of 2
      totalExercises: 2,
      timeline: [
        { exerciseId: "examA-q1", exerciseIndex: 0, timestamp: saraStarted, action: "enter" },
        {
          exerciseId: "examA-q1",
          exerciseIndex: 0,
          timestamp: new Date(new Date(saraStarted).getTime() + 18 * 60 * 1000).toISOString(),
          action: "leave",
        },
        {
          exerciseId: "examA-q2",
          exerciseIndex: 1,
          timestamp: new Date(new Date(saraStarted).getTime() + 18 * 60 * 1000).toISOString(),
          action: "enter",
        },
        {
          exerciseId: "examA-q2",
          exerciseIndex: 1,
          timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
          action: "answer",
        },
      ],
    },
  ],
  [
    "ahmed",
    {
      examId: "examA",
      studentId: "ahmed",
      startedAt: ahmedStarted,
      lastActivityAt: ahmedLastSeen,
      status: "away",
      currentExerciseIndex: 0,
      totalExercises: 2,
      timeline: [
        { exerciseId: "examA-q1", exerciseIndex: 0, timestamp: ahmedStarted, action: "enter" },
        {
          exerciseId: "examA-q1",
          exerciseIndex: 0,
          timestamp: new Date(new Date(ahmedStarted).getTime() + 22 * 60 * 1000).toISOString(),
          action: "answer",
        },
        {
          exerciseId: "examA-q1",
          exerciseIndex: 0,
          timestamp: ahmedLastSeen,
          action: "leave",
        },
      ],
    },
  ],
]);

studentSessions.set("examA", examASessions);

// student1 in exam1 — already submitted (pre-seeded for demo)
const exam1Student1Start = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
studentSessions.set(
  "exam1",
  new Map([
    [
      "student1",
      {
        examId: "exam1",
        studentId: "student1",
        startedAt: exam1Student1Start,
        lastActivityAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 600000).toISOString(),
        status: "submitted",
        currentExerciseIndex: 3,
        totalExercises: 4,
        timeline: [
          { exerciseId: "q1", exerciseIndex: 0, timestamp: exam1Student1Start, action: "enter" },
          { exerciseId: "q1", exerciseIndex: 0, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 90000).toISOString(), action: "answer" },
          { exerciseId: "q4", exerciseIndex: 3, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 580000).toISOString(), action: "submit" },
        ],
      },
    ],
  ])
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export const trackingService = {
  startStudentSession: async (
    examId: string,
    studentId: string,
    totalExercises: number,
    startTime: Date
  ): Promise<StudentExamSession> => {
    await new Promise((r) => setTimeout(r, 50));

    let examMap = studentSessions.get(examId);
    if (!examMap) {
      examMap = new Map();
      studentSessions.set(examId, examMap);
    }

    const nowIso = startTime.toISOString();
    const existing = examMap.get(studentId);
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

    examMap.set(studentId, session);
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
    await new Promise((r) => setTimeout(r, 10));

    let examMap = studentSessions.get(params.examId);
    if (!examMap) {
      examMap = new Map();
      studentSessions.set(params.examId, examMap);
    }

    const nowIso = new Date().toISOString();
    const existing = examMap.get(params.studentId);
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
    session.timeline.push({
      exerciseId: params.exerciseId,
      exerciseIndex: params.currentExerciseIndex,
      timestamp: nowIso,
      action: params.action,
    });

    examMap.set(params.studentId, session);
  },

  markSubmitted: async (examId: string, studentId: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 10));
    const examMap = studentSessions.get(examId);
    if (!examMap) return;
    const session = examMap.get(studentId);
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
    await new Promise((r) => setTimeout(r, 50));
    const examMap = studentSessions.get(examId);
    if (!examMap) return [];

    const now = Date.now();
    return Array.from(examMap.values()).map((session) => {
      const startedAtMs  = new Date(session.startedAt).getTime();
      const lastActivityMs = new Date(session.lastActivityAt).getTime();
      const elapsed = now - startedAtMs;
      const idle    = now - lastActivityMs;

      let status: StudentStatus = session.status;
      if (status !== "submitted") {
        if (elapsed > MAX_SESSION_MS) {
          status = "submitted";
        } else if (idle > 5 * 60 * 1000) {
          status = "away";
        } else {
          status = "online";
        }
      }
      return { ...session, status };
    });
  },

  recordExerciseAttempts: async (attempts: ExerciseAttempt[]): Promise<void> => {
    await new Promise((r) => setTimeout(r, 50));
    exerciseAttempts.push(...attempts);
  },

  getExerciseAttemptsByExam: async (examId: string): Promise<ExerciseAttempt[]> => {
    await new Promise((r) => setTimeout(r, 100));
    return exerciseAttempts.filter((a) => a.examId === examId);
  },
};

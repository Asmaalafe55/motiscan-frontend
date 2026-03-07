import {
  ExerciseAttempt,
  ExerciseNavigationEvent,
  StudentExamSession,
  StudentStatus,
} from "@/types";

// ---------------------------------------------------------------------------
// Pre-seeded exercise attempts so AI reports have real data to analyse
// ---------------------------------------------------------------------------
const exerciseAttempts: ExerciseAttempt[] = [
  // Sara — examA (submitted)
  {
    examId: "examA", exerciseId: "examA-q1", questionId: "examA-q1",
    studentId: "sara", exerciseType: "differences",
    timeStarted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    timeAnswered: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000).toISOString(),
    timeLeft: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
    durationOnExercise: 1080, charactersTyped: 142, editsCount: 5,
    timeToFirstKeystroke: 4200,
    answerValue: "Sun moved to the right; a cloud disappeared; door changed from red to blue; tree was removed; flowers changed from orange to purple; birds were added in the sky.",
    answerChanged: true, skipped: false, revisited: false,
  },
  {
    examId: "examA", exerciseId: "examA-q2", questionId: "examA-q2",
    studentId: "sara", exerciseType: "differences",
    timeStarted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
    timeAnswered: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 39 * 60 * 1000).toISOString(),
    timeLeft: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 39 * 60 * 1000).toISOString(),
    durationOnExercise: 1140, charactersTyped: 118, editsCount: 3,
    timeToFirstKeystroke: 6100,
    answerValue: "Curtains appeared on the window; fridge changed from white to beige; one cup was removed; the pear is gone; a wall clock was added.",
    answerChanged: true, skipped: false, revisited: true,
  },
  // Ahmed — examC (submitted, 2 days ago)
  {
    examId: "examC", exerciseId: "examC-q1", questionId: "examC-q1",
    studentId: "ahmed", exerciseType: "differences",
    timeStarted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    timeAnswered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
    timeLeft: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 17 * 60 * 1000).toISOString(),
    durationOnExercise: 900, charactersTyped: 98, editsCount: 2,
    timeToFirstKeystroke: 5800,
    answerValue: "The sun moved; a cloud was removed; the door colour changed; a tree disappeared; flowers changed colour; birds appeared.",
    answerChanged: false, skipped: false, revisited: false,
  },
  {
    examId: "examC", exerciseId: "examC-q2", questionId: "examC-q2",
    studentId: "ahmed", exerciseType: "differences",
    timeStarted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 17 * 60 * 1000).toISOString(),
    timeAnswered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 33 * 60 * 1000).toISOString(),
    timeLeft: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 33 * 60 * 1000).toISOString(),
    durationOnExercise: 960, charactersTyped: 112, editsCount: 4,
    timeToFirstKeystroke: 3900,
    answerValue: "Chalkboard became darker; one desk was removed; the clock is gone; an apple appeared; fewer books on the shelf; a small window was added.",
    answerChanged: true, skipped: false, revisited: false,
  },
  // Maya — examC (submitted, 2 days ago)
  {
    examId: "examC", exerciseId: "examC-q1", questionId: "examC-q1",
    studentId: "maya", exerciseType: "differences",
    timeStarted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    timeAnswered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
    timeLeft: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 22 * 60 * 1000).toISOString(),
    durationOnExercise: 1200, charactersTyped: 88, editsCount: 1,
    timeToFirstKeystroke: 7200,
    answerValue: "Sun is in different position; no cloud; door changed colour; tree missing; flowers different colour; birds added.",
    answerChanged: false, skipped: false, revisited: false,
  },
  {
    examId: "examC", exerciseId: "examC-q2", questionId: "examC-q2",
    studentId: "maya", exerciseType: "differences",
    timeStarted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 22 * 60 * 1000).toISOString(),
    timeAnswered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(),
    timeLeft: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(),
    durationOnExercise: 780, charactersTyped: 76, editsCount: 0,
    timeToFirstKeystroke: 4500,
    answerValue: "Board colour changed; fewer desks; clock removed; apple on desk; fewer books; extra window.",
    answerChanged: false, skipped: false, revisited: false,
  },
];

// examId -> (studentId -> session)
const studentSessions: Map<string, Map<string, StudentExamSession>> = new Map();

const MAX_SESSION_MS = 5 * 60 * 60 * 1000; // 5 hours

// ---------------------------------------------------------------------------
// Pre-seed mock sessions for examA (Group A live exam)
// Sara: online, on exercise 2 of 2, entered 45 min ago
// Ahmed: away (last activity 20 min ago), on exercise 1 of 2
// ---------------------------------------------------------------------------
const saraStarted  = new Date(Date.now() - 45 * 60 * 1000).toISOString();
const ahmedStarted = new Date(Date.now() - 65 * 60 * 1000).toISOString();
const ahmedLastSeen = new Date(Date.now() - 20 * 60 * 1000).toISOString();

const examASessions = new Map<string, StudentExamSession>([
  [
    "sara",
    {
      examId: "examA",
      studentId: "sara",
      startedAt: saraStarted,
      lastActivityAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      status: "online",
      currentExerciseIndex: 1,
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

// Pre-seed examC (completed — both Ahmed and Maya submitted)
const ahmedCStart = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
const mayaCStart  = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

studentSessions.set(
  "examC",
  new Map<string, StudentExamSession>([
    [
      "ahmed",
      {
        examId: "examC",
        studentId: "ahmed",
        startedAt: ahmedCStart,
        lastActivityAt: new Date(new Date(ahmedCStart).getTime() + 33 * 60 * 1000).toISOString(),
        status: "submitted",
        currentExerciseIndex: 1,
        totalExercises: 2,
        timeline: [
          { exerciseId: "examC-q1", exerciseIndex: 0, timestamp: ahmedCStart, action: "enter" },
          { exerciseId: "examC-q1", exerciseIndex: 0, timestamp: new Date(new Date(ahmedCStart).getTime() + 15 * 60 * 1000).toISOString(), action: "answer" },
          { exerciseId: "examC-q2", exerciseIndex: 1, timestamp: new Date(new Date(ahmedCStart).getTime() + 17 * 60 * 1000).toISOString(), action: "enter" },
          { exerciseId: "examC-q2", exerciseIndex: 1, timestamp: new Date(new Date(ahmedCStart).getTime() + 33 * 60 * 1000).toISOString(), action: "answer" },
          { exerciseId: "", exerciseIndex: 1, timestamp: new Date(new Date(ahmedCStart).getTime() + 33 * 60 * 1000).toISOString(), action: "submit" },
        ],
      },
    ],
    [
      "maya",
      {
        examId: "examC",
        studentId: "maya",
        startedAt: mayaCStart,
        lastActivityAt: new Date(new Date(mayaCStart).getTime() + 35 * 60 * 1000).toISOString(),
        status: "submitted",
        currentExerciseIndex: 1,
        totalExercises: 2,
        timeline: [
          { exerciseId: "examC-q1", exerciseIndex: 0, timestamp: mayaCStart, action: "enter" },
          { exerciseId: "examC-q1", exerciseIndex: 0, timestamp: new Date(new Date(mayaCStart).getTime() + 20 * 60 * 1000).toISOString(), action: "answer" },
          { exerciseId: "examC-q2", exerciseIndex: 1, timestamp: new Date(new Date(mayaCStart).getTime() + 22 * 60 * 1000).toISOString(), action: "enter" },
          { exerciseId: "examC-q2", exerciseIndex: 1, timestamp: new Date(new Date(mayaCStart).getTime() + 35 * 60 * 1000).toISOString(), action: "answer" },
          { exerciseId: "", exerciseIndex: 1, timestamp: new Date(new Date(mayaCStart).getTime() + 35 * 60 * 1000).toISOString(), action: "submit" },
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
      const startedAtMs    = new Date(session.startedAt).getTime();
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

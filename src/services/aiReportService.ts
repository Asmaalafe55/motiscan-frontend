import { ExerciseAttempt } from "@/types";

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface ExerciseBreakdown {
  exerciseId: string;
  order: number;
  type: string;
  durationSeconds: number;
  answerLength: number;
  skipped: boolean;
  revisited: boolean;
  editsCount?: number;
  timeToFirstKeystroke?: number; // ms
}

export interface AIReport {
  id: string;
  studentId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  generatedAt: string;
  totalTimeSpent: number; // seconds
  scores: {
    engagement: number;  // 0-100
    confidence: number;  // 0-100
    persistence: number; // 0-100
    emotionalState: number; // 0-100
  };
  emotionalStateLabel: "Positive" | "Neutral" | "Needs Attention";
  summary: string;
  recommendations: string[];
  exerciseBreakdown: ExerciseBreakdown[];
}

// ---------------------------------------------------------------------------
// Score computation helpers
// ---------------------------------------------------------------------------

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Engagement — how actively the student engaged with each exercise.
 * Signals: characters_typed, time_to_first_keystroke, duration_on_exercise, skipped.
 */
function computeEngagement(attempts: ExerciseAttempt[]): number {
  if (attempts.length === 0) return 55 + Math.floor(Math.random() * 20);
  const scores = attempts.map((a) => {
    let s = 40;
    if (!a.skipped) s += 20;
    if ((a.charactersTyped ?? 0) > 30) s += 15;
    if ((a.charactersTyped ?? 0) > 120) s += 10;
    if (a.timeToFirstKeystroke !== undefined && a.timeToFirstKeystroke < 4000) s += 10;
    if ((a.durationOnExercise ?? 0) > 60) s += 5;
    return clamp(s, 0, 100);
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Confidence — how sure the student was about their answers.
 * Signals: answer_changed, revisited, edits_count, skipped.
 */
function computeConfidence(attempts: ExerciseAttempt[]): number {
  if (attempts.length === 0) return 60 + Math.floor(Math.random() * 20);
  const scores = attempts.map((a) => {
    let s = 82;
    if (a.skipped) s -= 35;
    if (a.answerChanged) s -= 12;
    if (a.revisited) s -= 8;
    if ((a.editsCount ?? 0) > 5) s -= 10;
    return clamp(s, 0, 100);
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Persistence — how determined the student was to work through each exercise.
 * Signals: duration_on_exercise, skipped, edits_count (effort to refine), revisited.
 */
function computePersistence(attempts: ExerciseAttempt[]): number {
  if (attempts.length === 0) return 58 + Math.floor(Math.random() * 20);
  const scores = attempts.map((a) => {
    let s = 45;
    if (!a.skipped) s += 25;
    if ((a.durationOnExercise ?? 0) > 60) s += 10;
    if ((a.durationOnExercise ?? 0) > 180) s += 10;
    if ((a.editsCount ?? 0) > 0) s += 5;
    if (a.revisited) s += 5;
    return clamp(s, 0, 100);
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Emotional state — derived from the average of the other three scores,
 * plus a small random offset to give it a distinct value.
 */
function computeEmotionalState(
  engagement: number,
  confidence: number,
  persistence: number
): { score: number; label: "Positive" | "Neutral" | "Needs Attention" } {
  const avg = (engagement + confidence + persistence) / 3;
  const score = clamp(Math.round(avg + (Math.random() * 10 - 5)), 0, 100);
  const label: "Positive" | "Neutral" | "Needs Attention" =
    score >= 75 ? "Positive" : score >= 50 ? "Neutral" : "Needs Attention";
  return { score, label };
}

// ---------------------------------------------------------------------------
// Text generation helpers
// ---------------------------------------------------------------------------

function generateSummary(
  studentName: string,
  engagement: number,
  confidence: number,
  persistence: number,
  emotionalLabel: string,
  attempts: ExerciseAttempt[]
): string {
  const skipped = attempts.filter((a) => a.skipped).length;
  const totalChars = attempts.reduce((sum, a) => sum + (a.charactersTyped ?? 0), 0);
  const avgDuration =
    attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + (a.durationOnExercise ?? 0), 0) / attempts.length)
      : 0;

  const engWord = engagement >= 75 ? "high" : engagement >= 50 ? "moderate" : "low";
  const confWord = confidence >= 75 ? "confident" : confidence >= 50 ? "moderately confident" : "hesitant";
  const persWord = persistence >= 75 ? "strong persistence" : persistence >= 50 ? "moderate persistence" : "reduced persistence";

  const skipNote =
    skipped > 0
      ? ` ${skipped} exercise${skipped > 1 ? "s were" : " was"} skipped,`
      : "";

  const timeNote =
    avgDuration > 0
      ? ` with an average of ${avgDuration} seconds spent per exercise`
      : "";

  return (
    `${studentName} demonstrated ${engWord} engagement during this assessment${timeNote}. ` +
    `A total of ${totalChars} characters were written across all responses.${skipNote} ` +
    `The student appeared ${confWord} in their answers and showed ${persWord} throughout the session. ` +
    `Overall, the emotional state analysis reflects a ${emotionalLabel.toLowerCase()} disposition, suggesting that ` +
    (engagement >= 65 && persistence >= 65
      ? "the student is well-engaged and may benefit from more challenging, open-ended material."
      : "targeted motivational support and structured scaffolding could improve future performance.")
  );
}

function generateRecommendations(
  engagement: number,
  confidence: number,
  persistence: number
): string[] {
  const recs: string[] = [];

  if (engagement < 65) {
    recs.push(
      "Introduce more visually engaging or interactive exercises to boost initial engagement and shorten time-to-first-response."
    );
  } else {
    recs.push(
      "Leverage the student's strong engagement by offering extension activities and more complex observation tasks that deepen exploration."
    );
  }

  if (confidence < 65) {
    recs.push(
      "Provide incremental feedback during exercises to build self-assurance; consider scaffolded tasks with structured hints before fully independent work."
    );
  } else {
    recs.push(
      "Channel the student's confidence into peer-review or self-assessment activities that develop metacognitive awareness."
    );
  }

  if (persistence < 65) {
    recs.push(
      "Break future assessments into shorter, timed segments with clear milestones to sustain focus and reduce the likelihood of skipping exercises."
    );
  } else {
    recs.push(
      "Maintain persistence by varying difficulty progressively across exercises to keep the student challenged without inducing cognitive overload."
    );
  }

  return recs;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const aiReportService = {
  generateAIReport: async (params: {
    studentId: string;
    studentName: string;
    examId: string;
    examTitle: string;
    attempts: ExerciseAttempt[];
    totalTimeSpent: number; // seconds
  }): Promise<AIReport> => {
    // Simulate AI processing time
    await new Promise((r) => setTimeout(r, 2000));

    const { studentId, studentName, examId, examTitle, attempts, totalTimeSpent } = params;

    const engagement = computeEngagement(attempts);
    const confidence = computeConfidence(attempts);
    const persistence = computePersistence(attempts);
    const { score: emotionalScore, label: emotionalLabel } = computeEmotionalState(
      engagement,
      confidence,
      persistence
    );

    const exerciseBreakdown: ExerciseBreakdown[] = attempts.map((a, i) => ({
      exerciseId: a.exerciseId,
      order: i + 1,
      type: a.exerciseType,
      durationSeconds: a.durationOnExercise ?? 0,
      answerLength:
        typeof a.answerValue === "string"
          ? a.answerValue.length
          : (a.charactersTyped ?? 0),
      skipped: a.skipped,
      revisited: a.revisited,
      editsCount: a.editsCount,
      timeToFirstKeystroke:
        a.timeToFirstKeystroke !== undefined
          ? (a.timeToFirstKeystroke as number)
          : undefined,
    }));

    return {
      id: `ai-report-${Date.now()}`,
      studentId,
      studentName,
      examId,
      examTitle,
      generatedAt: new Date().toISOString(),
      totalTimeSpent,
      scores: { engagement, confidence, persistence, emotionalState: emotionalScore },
      emotionalStateLabel: emotionalLabel,
      summary: generateSummary(studentName, engagement, confidence, persistence, emotionalLabel, attempts),
      recommendations: generateRecommendations(engagement, confidence, persistence),
      exerciseBreakdown,
    };
  },
};

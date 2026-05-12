import { ExerciseAttempt, MeasureDimension } from "@/types";

// ---------------------------------------------------------------------------
// Exercise-type → psychological measures mapping
// Covers all current and planned exercise types.
// ---------------------------------------------------------------------------

export const EXERCISE_TYPE_MEASURES: Record<string, MeasureDimension[]> = {
  differences:             ["attention", "analytical_engagement"],
  shape_copy:              ["rule_compliance", "effort", "confidence"],
  analytical_perception:   ["analytical_perception", "attention_to_detail", "visual_decomposition"],
  rating_scale:            ["self_awareness", "honesty_indicators"],
  similarity_ranking:      ["analytical_engagement", "thoroughness"],
  multiple_choice:         ["analytical_engagement"],
  likert_scale:            ["self_awareness", "emotional_state"],
  priority_sort:           ["decision_making", "focus", "goal_clarity"],
};

// Which measure dimensions roll up into which top-level score.
const DIMENSION_TO_SCORE: Record<
  MeasureDimension,
  "engagement" | "confidence" | "persistence" | "emotionalState"
> = {
  attention:              "engagement",
  analytical_engagement:  "engagement",
  analytical_perception:  "engagement",
  attention_to_detail:    "engagement",
  visual_decomposition:   "engagement",
  rule_compliance:        "confidence",
  effort:                 "persistence",
  confidence:             "confidence",
  emotional_state:        "emotionalState",
  self_expression_depth:  "emotionalState",
  self_awareness:         "confidence",
  honesty_indicators:     "confidence",
  cognitive_persistence:  "persistence",
  thoroughness:           "persistence",
  creativity:             "emotionalState",
  risk_taking:            "emotionalState",
  decision_making:        "confidence",
  focus:                  "engagement",
  goal_clarity:           "confidence",
};

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface AttributionEntry {
  exerciseOrder: number;
  exerciseType: string;
  measures: MeasureDimension[];
  explanation: string;
  indicator: "positive" | "warning" | "low";
}

export interface ScoreAttribution {
  scoreKey: "engagement" | "confidence" | "persistence" | "emotionalState";
  scoreName: string;
  score: number;
  color: string;
  entries: AttributionEntry[];
}

export interface ExerciseBreakdown {
  exerciseId: string;
  order: number;
  type: string;
  measures: MeasureDimension[];
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
    engagement: number;      // 0-100
    confidence: number;      // 0-100
    persistence: number;     // 0-100
    emotionalState: number;  // 0-100
  };
  emotionalStateLabel: "Positive" | "Neutral" | "Needs Attention";
  summary: string;
  recommendations: string[];
  scoreAttributions: ScoreAttribution[];
  exerciseBreakdown: ExerciseBreakdown[];
}

// ---------------------------------------------------------------------------
// Score computation helpers (unchanged)
// ---------------------------------------------------------------------------

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

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

function computeConfidence(attempts: ExerciseAttempt[]): number {
  if (attempts.length === 0) return 60 + Math.floor(Math.random() * 20);
  const scores = attempts.map((a) => {
    let s = 82;
    if (a.skipped) s -= 35;
    if (a.answerChanged) s -= 12;
    if (a.revisited) s -= 8;
    if (a.exerciseType !== "differences" && (a.editsCount ?? 0) > 5) s -= 10;

    // SHAPE_COPY: undo_count reduces confidence
    if (a.exerciseType === "shape_copy") {
      const meta = a.metadata as { figures?: Array<{ undo_count?: number; shapes_deleted?: number }> } | undefined;
      const undos = (meta?.figures ?? []).reduce((sum, f) => sum + (f.undo_count ?? 0), 0);
      const deletions = (meta?.figures ?? []).reduce((sum, f) => sum + (f.shapes_deleted ?? 0), 0);
      if (undos > 5) s -= 12;
      else if (undos > 2) s -= 6;
      if (deletions > 3) s -= 8;
    }

    // ANALYTICAL_PERCEPTION: many answer changes = low confidence
    if (a.exerciseType === "analytical_perception") {
      const meta = a.metadata as { items_answered_changed?: number; accuracy_percentage?: number } | undefined;
      const changed = meta?.items_answered_changed ?? 0;
      const acc = meta?.accuracy_percentage ?? 100;
      if (changed > 4) s -= 15;
      else if (changed > 2) s -= 8;
      if (acc < 40) s -= 10;
    }
    return clamp(s, 0, 100);
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function computePersistence(attempts: ExerciseAttempt[]): number {
  if (attempts.length === 0) return 58 + Math.floor(Math.random() * 20);
  const scores = attempts.map((a) => {
    let s = 45;
    if (!a.skipped) s += 25;
    if ((a.durationOnExercise ?? 0) > 60) s += 10;
    if ((a.durationOnExercise ?? 0) > 180) s += 10;
    if ((a.editsCount ?? 0) > 0) s += 5;
    if (a.revisited) s += 5;

    // SHAPE_COPY: shapes_deleted shows effort/persistence
    if (a.exerciseType === "shape_copy") {
      const meta = a.metadata as { figures?: Array<{ total_shapes_drawn?: number; shapes_deleted?: number; shapes_moved?: number }> } | undefined;
      const totalShapes = (meta?.figures ?? []).reduce((sum, f) => sum + (f.total_shapes_drawn ?? 0), 0);
      const deletions = (meta?.figures ?? []).reduce((sum, f) => sum + (f.shapes_deleted ?? 0), 0);
      const moved = (meta?.figures ?? []).reduce((sum, f) => sum + (f.shapes_moved ?? 0), 0);
      if (totalShapes > 4) s += 10;
      if (deletions > 0) s += 5;  // revision = effort
      if (moved > 2) s += 5;      // refinement = persistence
    }

    // ANALYTICAL_PERCEPTION: fewer skips + time spent = more persistent
    if (a.exerciseType === "analytical_perception") {
      const meta = a.metadata as { total_skipped?: number; total_time_seconds?: number } | undefined;
      const skipped = meta?.total_skipped ?? 0;
      const totalTime = meta?.total_time_seconds ?? 0;
      if (skipped === 0) s += 15;
      else if (skipped <= 2) s += 5;
      else s -= 10;
      if (totalTime > 120) s += 10;
    }

    return clamp(s, 0, 100);
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

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
// Attribution helpers
// ---------------------------------------------------------------------------

/**
 * Generates a one-line human-readable explanation and quality indicator
 * for a single exercise attempt, specific to the exercise type.
 */
function buildAttributionEntry(
  attempt: ExerciseAttempt,
  order: number,
  measures: MeasureDimension[]
): AttributionEntry {
  const type = attempt.exerciseType;
  let explanation = "";
  let indicator: "positive" | "warning" | "low" = "positive";

  if (attempt.skipped) {
    explanation = "Exercise was skipped without a response.";
    indicator = "low";
    return { exerciseOrder: order, exerciseType: type, measures, explanation, indicator };
  }

  if (type === "differences") {
    const ttfk = attempt.timeToFirstKeystroke ?? 99999;
    const chars = attempt.charactersTyped ?? 0;
    const edits = attempt.editsCount ?? 0;
    if (chars > 120 && edits > 0) {
      explanation = `Wrote ${chars} characters and refined the answer ${edits} time${
        edits !== 1 ? "s" : ""
      } — strong analytical engagement.`;
      indicator = "positive";
    } else if (chars > 50) {
      explanation = `Responded with ${chars} characters; moderate observation level recorded.`;
      indicator = ttfk < 4000 ? "positive" : "warning";
    } else if (ttfk > 10000) {
      explanation = `Delayed start (${Math.round(ttfk / 1000)}s to first keystroke) with limited written output.`;
      indicator = "warning";
    } else {
      explanation = `Minimal written response (${chars} characters); limited engagement signal.`;
      indicator = "warning";
    }
  } else if (type === "rating_scale") {
    const val = typeof attempt.answerValue === "number" ? attempt.answerValue : null;
    const dur = attempt.durationOnExercise ?? 0;
    if (val !== null) {
      const level = val >= 7 ? "high" : val >= 4 ? "moderate" : "low";
      const pace = dur > 10 ? "after deliberation" : "quickly";
      explanation = `Self-rated ${val}/10 (${level}) — responded ${pace}, indicating ${level} self-awareness.`;
      indicator = val >= 7 ? "positive" : val >= 4 ? "warning" : "low";
    } else {
      explanation = "Rating value was not submitted.";
      indicator = "low";
    }
  } else if (type === "likert_scale") {
    const val = attempt.answerValue;
    if (val) {
      explanation = `Selected "${val}" — Likert response reflects conscious attitude and self-awareness.`;
      indicator = "positive";
    } else {
      explanation = "No Likert scale response was submitted.";
      indicator = "warning";
    }
  } else if (type === "multiple_choice") {
    if (attempt.revisited) {
      explanation = "Returned to this question and reconsidered — analytical re-evaluation detected.";
      indicator = "warning";
    } else if (attempt.answerChanged) {
      explanation = "Changed answer at least once, indicating active review of options.";
      indicator = "warning";
    } else {
      explanation = "Selected answer decisively without backtracking — direct analytical decision.";
      indicator = "positive";
    }
  } else if (type === "priority_sort") {
    const meta = (attempt.metadata ?? {}) as Record<string, unknown>;
    const totalMoves = typeof meta.total_moves === "number" ? meta.total_moves : 0;
    const reorderCount = typeof meta.reorder_count === "number" ? meta.reorder_count : 0;
    const ttfm = typeof meta.time_to_first_move === "number" ? meta.time_to_first_move : undefined;
    const timeSpent =
      typeof meta.time_spent_seconds === "number" ? meta.time_spent_seconds : undefined;

    // decision_making: fewer reorders suggests decisive choices
    if (reorderCount <= 1 && totalMoves <= 6) {
      explanation =
        "Chose a priority order with very few reorders, suggesting decisive decision-making and clear internal criteria.";
      indicator = "positive";
    } else if (reorderCount <= 4) {
      explanation =
        "Adjusted the priority order a few times, indicating exploratory decision-making before settling on a final ranking.";
      indicator = "warning";
    } else {
      explanation =
        "Reordered tasks many times before settling, which may reflect uncertainty about priorities or difficulty committing to decisions.";
      indicator = "low";
    }

    // focus: shorter time_to_first_move implies quick engagement
    if (ttfm !== undefined && ttfm > 10) {
      explanation += ` Took over ${Math.round(
        ttfm
      )} seconds before the first move, suggesting slower initial focus on the task.`;
    }

    // goal_clarity: how many moves were actual reorders vs initial placements
    if (totalMoves > 0) {
      const reorderRatio = reorderCount / totalMoves;
      if (reorderRatio < 0.3) {
        explanation += " Most moves were initial placements, pointing to strong clarity about goals.";
      } else if (reorderRatio > 0.6) {
        explanation +=
          " A large share of moves were reorders, which may indicate shifting priorities or limited goal clarity.";
      }
    }

    if (timeSpent !== undefined && timeSpent > 240) {
      explanation += " Spent a long time on this ranking, which could reflect deep reflection or indecision.";
    }
  } else if (type === "analytical_perception") {
    const meta = attempt.metadata as {
      accuracy_percentage?: number;
      total_correct?: number;
      total_skipped?: number;
      avg_time_per_item_seconds?: number;
      items_answered_changed?: number;
      items?: Array<{ skipped?: boolean; is_correct?: boolean }>;
    } | undefined;

    if (!meta) {
      explanation = "No analytical perception data recorded.";
      indicator = "low";
    } else {
      const acc = meta.accuracy_percentage ?? 0;
      const skipped = meta.total_skipped ?? 0;
      const changed = meta.items_answered_changed ?? 0;
      const avgTime = meta.avg_time_per_item_seconds ?? 0;

      if (acc >= 75 && skipped === 0) {
        explanation = `High accuracy (${acc}%) with no skips — strong visual decomposition and analytical perception.`;
        indicator = "positive";
      } else if (acc >= 50) {
        explanation = `Moderate accuracy (${acc}%)${skipped > 0 ? `, ${skipped} item${skipped !== 1 ? "s" : ""} skipped` : ""}${avgTime < 5 ? " — fast responses suggest shallow analysis" : ""}.`;
        indicator = avgTime < 5 ? "warning" : "positive";
      } else {
        explanation = `Low accuracy (${acc}%)${changed > 0 ? ` with ${changed} answer revision${changed !== 1 ? "s" : ""}` : ""} — limited visual decomposition detected.`;
        indicator = "low";
      }
    }
  } else if (type === "shape_copy") {
    const meta = attempt.metadata as {
      figures?: Array<{
        total_shapes_drawn?: number;
        shapes_deleted?: number;
        undo_count?: number;
        time_first_shape_drawn?: string;
        time_started?: string;
        required_rules?: string[];
      }>;
    } | undefined;

    if (!meta?.figures || meta.figures.length === 0) {
      explanation = "No drawing data recorded — exercise may have been skipped.";
      indicator = "low";
    } else {
      const totalShapes = meta.figures.reduce((s, f) => s + (f.total_shapes_drawn ?? 0), 0);
      const totalDeleted = meta.figures.reduce((s, f) => s + (f.shapes_deleted ?? 0), 0);
      const totalUndos = meta.figures.reduce((s, f) => s + (f.undo_count ?? 0), 0);

      const engagementDelay = meta.figures.some((f) => {
        if (!f.time_first_shape_drawn || !f.time_started) return false;
        const delay = new Date(f.time_first_shape_drawn).getTime() - new Date(f.time_started).getTime();
        return delay > 10000;
      });

      if (totalShapes > 4 && totalDeleted > 0) {
        explanation = `Drew ${totalShapes} shapes across figures with ${totalDeleted} revision${totalDeleted !== 1 ? "s" : ""} — strong effort and rule engagement.`;
        indicator = "positive";
      } else if (totalShapes > 2) {
        explanation = `Completed the drawing task with ${totalShapes} shapes; ${totalUndos} undo${totalUndos !== 1 ? "s" : ""} detected — moderate confidence.`;
        indicator = totalUndos > 3 ? "warning" : "positive";
      } else if (totalShapes > 0) {
        explanation = `Minimal drawing output (${totalShapes} shape${totalShapes !== 1 ? "s" : ""}); limited rule compliance engagement.`;
        indicator = engagementDelay ? "warning" : "low";
      } else {
        explanation = "No shapes drawn — exercise appears unattempted.";
        indicator = "low";
      }
    }
  } else {
    const dur = attempt.durationOnExercise ?? 0;
    explanation =
      dur > 60
        ? `Spent ${dur}s on this exercise, showing sustained effort.`
        : `Completed in ${dur > 0 ? dur + "s" : "under a minute"}.`;
    indicator = dur > 30 ? "positive" : "warning";
  }

  return { exerciseOrder: order, exerciseType: type, measures, explanation, indicator };
}

/**
 * For each of the four scores, determines which exercises contributed
 * (based on measure-to-score mapping) and generates attribution entries.
 */
function buildScoreAttributions(
  attempts: ExerciseAttempt[],
  scores: {
    engagement: number;
    confidence: number;
    persistence: number;
    emotionalState: number;
  },
  emotionalLabel: string
): ScoreAttribution[] {
  type ScoreKey = "engagement" | "confidence" | "persistence" | "emotionalState";

  const CONFIGS: {
    key: ScoreKey;
    name: string;
    color: string;
    relevant: MeasureDimension[];
  }[] = [
    {
      key: "engagement",
      name: "Engagement",
      color: "#3b82f6",
      relevant: [
        "attention",
        "analytical_engagement",
        "analytical_perception",
        "attention_to_detail",
        "visual_decomposition",
        "focus",
      ],
    },
    {
      key: "confidence",
      name: "Confidence",
      color: "#8b5cf6",
      relevant: [
        "confidence",
        "rule_compliance",
        "self_awareness",
        "honesty_indicators",
        "decision_making",
        "goal_clarity",
      ],
    },
    {
      key: "persistence",
      name: "Persistence",
      color: "#10b981",
      relevant: ["effort", "cognitive_persistence", "thoroughness"],
    },
    {
      key: "emotionalState",
      name: "Emotional State",
      // Mirror the same dynamic color used in the circular charts
      color:
        emotionalLabel === "Positive"
          ? "#10b981"
          : emotionalLabel === "Neutral"
          ? "#f59e0b"
          : "#ef4444",
      relevant: ["emotional_state", "self_expression_depth", "creativity", "risk_taking"],
    },
  ];

  return CONFIGS.map(({ key, name, color, relevant }) => {
    const entries: AttributionEntry[] = [];

    for (let i = 0; i < attempts.length; i++) {
      const a = attempts[i];
      const typeMeasures = EXERCISE_TYPE_MEASURES[a.exerciseType] ?? [];
      const matching = typeMeasures.filter((m) => relevant.includes(m));
      if (matching.length > 0) {
        entries.push(buildAttributionEntry(a, i + 1, matching));
      }
    }

    // If no exercises specifically target this score's dimensions,
    // include all exercises as general contributors.
    if (entries.length === 0 && attempts.length > 0) {
      for (let i = 0; i < attempts.length; i++) {
        const a = attempts[i];
        const typeMeasures = EXERCISE_TYPE_MEASURES[a.exerciseType] ?? [];
        entries.push(buildAttributionEntry(a, i + 1, typeMeasures));
      }
    }

    return { scoreKey: key, scoreName: name, score: scores[key], color, entries };
  });
}

// ---------------------------------------------------------------------------
// Text generation helpers (unchanged)
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
      ? Math.round(
          attempts.reduce((s, a) => s + (a.durationOnExercise ?? 0), 0) / attempts.length
        )
      : 0;

  const engWord = engagement >= 75 ? "high" : engagement >= 50 ? "moderate" : "low";
  const confWord =
    confidence >= 75 ? "confident" : confidence >= 50 ? "moderately confident" : "hesitant";
  const persWord =
    persistence >= 75
      ? "strong persistence"
      : persistence >= 50
      ? "moderate persistence"
      : "reduced persistence";

  const skipNote =
    skipped > 0 ? ` ${skipped} exercise${skipped > 1 ? "s were" : " was"} skipped,` : "";

  const timeNote =
    avgDuration > 0 ? ` with an average of ${avgDuration} seconds spent per exercise` : "";

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

  recs.push(
    engagement < 65
      ? "Introduce more visually engaging or interactive exercises to boost initial engagement and shorten time-to-first-response."
      : "Leverage the student's strong engagement by offering extension activities and more complex observation tasks that deepen exploration."
  );

  recs.push(
    confidence < 65
      ? "Provide incremental feedback during exercises to build self-assurance; consider scaffolded tasks with structured hints before fully independent work."
      : "Channel the student's confidence into peer-review or self-assessment activities that develop metacognitive awareness."
  );

  recs.push(
    persistence < 65
      ? "Break future assessments into shorter, timed segments with clear milestones to sustain focus and reduce the likelihood of skipping exercises."
      : "Maintain persistence by varying difficulty progressively across exercises to keep the student challenged without inducing cognitive overload."
  );

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
    totalTimeSpent: number;
  }): Promise<AIReport> => {
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

    const scores = { engagement, confidence, persistence, emotionalState: emotionalScore };

    const exerciseBreakdown: ExerciseBreakdown[] = attempts.map((a, i) => ({
      exerciseId: a.exerciseId,
      order: i + 1,
      type: a.exerciseType,
      measures: EXERCISE_TYPE_MEASURES[a.exerciseType] ?? [],
      durationSeconds: a.durationOnExercise ?? 0,
      answerLength:
        typeof a.answerValue === "string" ? a.answerValue.length : (a.charactersTyped ?? 0),
      skipped: a.skipped,
      revisited: a.revisited,
      editsCount: a.editsCount,
      timeToFirstKeystroke: a.timeToFirstKeystroke,
    }));

    const scoreAttributions = buildScoreAttributions(attempts, scores, emotionalLabel);

    return {
      id: `ai-report-${Date.now()}`,
      studentId,
      studentName,
      examId,
      examTitle,
      generatedAt: new Date().toISOString(),
      totalTimeSpent,
      scores,
      emotionalStateLabel: emotionalLabel,
      summary: generateSummary(studentName, engagement, confidence, persistence, emotionalLabel, attempts),
      recommendations: generateRecommendations(engagement, confidence, persistence),
      scoreAttributions,
      exerciseBreakdown,
    };
  },
};

// Re-export for use in the report page
export type { MeasureDimension };
export { DIMENSION_TO_SCORE };


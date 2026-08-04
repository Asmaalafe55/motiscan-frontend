import { api, ApiError, getToken } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/getApiBaseUrl";
import type { Answer } from "@/types";

export interface Submission {
  id: string;
  studentId: string;
  examId: string;
  sessionId: string | null;
  status: "in_progress" | "submitted";
  submittedAt: string | null;
  createdAt: string;
}

export interface TrackingEvent {
  id: string;
  submissionId: string;
  exerciseId: string | null;
  eventType: string;
  payload: Record<string, unknown>;
  recordedAt: string;
}

let activeSubmissionId: string | null = null;

/**
 * Rebuild the latest answer map from tracking history.
 * Chronological order: later answer_change / progress_save wins.
 */
export function reconstructAnswersFromEvents(
  events: TrackingEvent[]
): Record<string, string | number> {
  const answers: Record<string, string | number> = {};

  for (const ev of events) {
    if (ev.eventType === "progress_save") {
      const list = ev.payload?.answers;
      if (Array.isArray(list)) {
        for (const item of list) {
          const a = item as Partial<Answer>;
          if (
            typeof a?.questionId === "string" &&
            a.value !== undefined &&
            a.value !== null &&
            a.value !== ""
          ) {
            answers[a.questionId] = a.value as string | number;
          }
        }
      }
      continue;
    }

    if (
      ev.eventType === "answer_change" &&
      typeof ev.exerciseId === "string" &&
      ev.payload?.value !== undefined &&
      ev.payload.value !== null &&
      ev.payload.value !== ""
    ) {
      answers[ev.exerciseId] = ev.payload.value as string | number;
    }
  }

  return answers;
}

/** Last exercise index the student was on (from enter events). */
export function reconstructResumeIndex(events: TrackingEvent[], totalExercises: number): number {
  for (let i = events.length - 1; i >= 0; i--) {
    const ev = events[i];
    if (ev.eventType !== "exercise_enter") continue;
    const idx = ev.payload?.exerciseIndex;
    if (typeof idx === "number" && idx >= 0 && idx < totalExercises) {
      return idx;
    }
  }
  return 0;
}

export const submissionService = {
  getActiveSubmissionId: () => activeSubmissionId,

  startSubmission: async (examId: string, totalExercises = 0): Promise<Submission> => {
    try {
      const data = await api.post<{ submission: Submission }>(
        `/api/submissions/${examId}`,
        { totalExercises }
      );
      activeSubmissionId = data.submission.id;
      return data.submission;
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        throw new Error("Exam already submitted");
      }
      throw err;
    }
  },

  saveEvent: async (
    submissionId: string,
    eventType: string,
    payload: Record<string, unknown> = {},
    exerciseId?: string
  ): Promise<TrackingEvent> => {
    const data = await api.post<{ event: TrackingEvent }>(
      `/api/submissions/${submissionId}/events`,
      { eventType, payload, exerciseId }
    );
    return data.event;
  },

  /**
   * Persist a full answers snapshot. Uses keepalive so it can complete
   * during tab close / navigation away.
   */
  saveProgressBeacon: (
    submissionId: string,
    answers: Answer[],
    extra: Record<string, unknown> = {}
  ): void => {
    if (typeof window === "undefined") return;
    const token = getToken();
    if (!token) return;

    void fetch(`${getApiBaseUrl()}/api/submissions/${submissionId}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        eventType: "progress_save",
        payload: { answers, ...extra },
      }),
      keepalive: true,
    }).catch(() => {
      // Best-effort during unload — ignore network errors.
    });
  },

  finalize: async (submissionId: string): Promise<Submission> => {
    const data = await api.put<{ submission: Submission }>(
      `/api/submissions/${submissionId}/finalize`
    );
    activeSubmissionId = null;
    return data.submission;
  },

  getById: async (submissionId: string): Promise<{ submission: Submission; trackingEvents: TrackingEvent[] }> => {
    return api.get(`/api/submissions/${submissionId}`);
  },
};

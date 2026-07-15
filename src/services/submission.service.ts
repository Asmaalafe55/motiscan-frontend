import { api } from "@/lib/api";

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

export const submissionService = {
  getActiveSubmissionId: () => activeSubmissionId,

  startSubmission: async (examId: string, totalExercises = 0): Promise<Submission> => {
    const data = await api.post<{ submission: Submission }>(
      `/api/submissions/${examId}`,
      { totalExercises }
    );
    activeSubmissionId = data.submission.id;
    return data.submission;
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

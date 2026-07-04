import { LiveSession } from "@/types";
import { getSocket } from "@/lib/socket";

const liveSessions: Map<string, LiveSession> = new Map();

export const liveSessionService = {
  getLiveSession: async (examId: string): Promise<LiveSession | null> => {
    return liveSessions.get(examId) ?? null;
  },

  startLiveSession: async (examId: string): Promise<LiveSession> => {
    const session: LiveSession = liveSessions.get(examId) ?? {
      examId,
      connectedStudents: [],
      startedAt: new Date().toISOString(),
    };
    liveSessions.set(examId, session);
    return session;
  },

  endLiveSession: async (examId: string): Promise<void> => {
    liveSessions.delete(examId);
  },

  openTeacherSession: (examId: string): void => {
    getSocket().emit("teacher:openSession", { examId });
  },

  closeTeacherSession: (examId: string): void => {
    getSocket().emit("teacher:closeSession", { examId });
  },

  joinSession: (examId: string, studentId: string, studentName: string): void => {
    getSocket().emit("student:join", { examId, studentId, studentName });
  },

  notifyExerciseChange: (exerciseIndex: number): void => {
    getSocket().emit("student:exerciseChange", { exerciseIndex });
  },

  addStudentToSession: async (examId: string, studentId: string): Promise<LiveSession | null> => {
    const session = liveSessions.get(examId);
    if (!session) return null;
    if (!session.connectedStudents.includes(studentId)) {
      session.connectedStudents.push(studentId);
    }
    return session;
  },

  removeStudentFromSession: async (
    examId: string,
    studentId: string
  ): Promise<LiveSession | null> => {
    const session = liveSessions.get(examId);
    if (!session) return null;
    session.connectedStudents = session.connectedStudents.filter((id) => id !== studentId);
    return session;
  },

  getConnectedStudents: async (examId: string): Promise<string[]> => {
    return liveSessions.get(examId)?.connectedStudents ?? [];
  },

  /** Called by LiveSessionContext when socket events arrive */
  setConnectedStudents: (examId: string, studentIds: string[]): void => {
    const existing = liveSessions.get(examId);
    liveSessions.set(examId, {
      examId,
      connectedStudents: studentIds,
      startedAt: existing?.startedAt ?? new Date().toISOString(),
    });
  },
};

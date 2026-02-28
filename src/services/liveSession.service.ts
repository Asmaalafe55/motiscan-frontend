import { LiveSession } from "@/types";

// Mock live session state (in real app, this would be WebSocket/Redis)
const liveSessions: Map<string, LiveSession> = new Map([
  // Pre-seeded: examA (Group A) is live with Sara connected
  [
    "examA",
    {
      examId: "examA",
      connectedStudents: ["sara"], // Ahmed has left (offline)
      startedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(), // 50 min ago
    },
  ],
  // exam2 (Physics) is also live
  [
    "exam2",
    {
      examId: "exam2",
      connectedStudents: [],
      startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ],
]);

export const liveSessionService = {
  getLiveSession: async (examId: string): Promise<LiveSession | null> => {
    await new Promise((r) => setTimeout(r, 200));
    return liveSessions.get(examId) ?? null;
  },

  startLiveSession: async (examId: string): Promise<LiveSession> => {
    await new Promise((r) => setTimeout(r, 300));
    const session: LiveSession = {
      examId,
      connectedStudents: [],
      startedAt: new Date().toISOString(),
    };
    liveSessions.set(examId, session);
    return session;
  },

  endLiveSession: async (examId: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 200));
    liveSessions.delete(examId);
  },

  addStudentToSession: async (examId: string, studentId: string): Promise<LiveSession | null> => {
    await new Promise((r) => setTimeout(r, 200));
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
    await new Promise((r) => setTimeout(r, 200));
    const session = liveSessions.get(examId);
    if (!session) return null;
    session.connectedStudents = session.connectedStudents.filter((id) => id !== studentId);
    return session;
  },

  getConnectedStudents: async (examId: string): Promise<string[]> => {
    await new Promise((r) => setTimeout(r, 200));
    return liveSessions.get(examId)?.connectedStudents ?? [];
  },
};

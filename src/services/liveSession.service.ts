import { LiveSession } from "@/types";

// Mock live session state (in real app, this would be WebSocket/Redis)
let liveSessions: Map<string, LiveSession> = new Map();

export const liveSessionService = {
  getLiveSession: async (examId: string): Promise<LiveSession | null> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return liveSessions.get(examId) || null;
  },

  startLiveSession: async (examId: string): Promise<LiveSession> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const session: LiveSession = {
      examId,
      connectedStudents: [],
      startedAt: new Date().toISOString(),
    };
    liveSessions.set(examId, session);
    return session;
  },

  endLiveSession: async (examId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    liveSessions.delete(examId);
  },

  addStudentToSession: async (examId: string, studentId: string): Promise<LiveSession | null> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
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
    await new Promise((resolve) => setTimeout(resolve, 200));
    const session = liveSessions.get(examId);
    if (!session) return null;
    
    session.connectedStudents = session.connectedStudents.filter((id) => id !== studentId);
    return session;
  },

  getConnectedStudents: async (examId: string): Promise<string[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const session = liveSessions.get(examId);
    return session?.connectedStudents || [];
  },
};

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { LiveSession } from "@/types";
import { liveSessionService } from "@/services/liveSession.service";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { pushActivity } from "@/lib/notifications";

interface LiveSessionContextType {
  activeSessions: Map<string, LiveSession>;
  getSession: (examId: string) => LiveSession | null;
  refreshSession: (examId: string) => Promise<void>;
  isSocketConnected: boolean;
  setActiveExamId: (examId: string | null) => void;
}

const LiveSessionContext = createContext<LiveSessionContextType | undefined>(undefined);

export function LiveSessionProvider({ children }: { children: ReactNode }) {
  const [activeSessions, setActiveSessions] = useState<Map<string, LiveSession>>(new Map());
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const activeExamIdRef = useRef<string | null>(null);

  const setActiveExamId = useCallback((examId: string | null) => {
    activeExamIdRef.current = examId;
  }, []);

  const syncSession = useCallback((examId: string) => {
    liveSessionService.getLiveSession(examId).then((s) => {
      if (s) {
        setActiveSessions((prev) => {
          const next = new Map(prev);
          next.set(examId, s);
          return next;
        });
      }
    });
  }, []);

  const addConnectedStudent = useCallback((examId: string, studentId: string) => {
    liveSessionService.startLiveSession(examId).then(() => {
      liveSessionService.getLiveSession(examId).then((session) => {
        const ids = session?.connectedStudents ?? [];
        if (!ids.includes(studentId)) {
          liveSessionService.setConnectedStudents(examId, [...ids, studentId]);
          syncSession(examId);
        }
      });
    });
  }, [syncSession]);

  const removeConnectedStudent = useCallback((examId: string, studentId: string) => {
    liveSessionService.getLiveSession(examId).then((session) => {
      const ids = (session?.connectedStudents ?? []).filter((id) => id !== studentId);
      liveSessionService.setConnectedStudents(examId, ids);
      syncSession(examId);
    });
  }, [syncSession]);

  useEffect(() => {
    const socket = connectSocket();

    const onConnect = () => {
      console.log("[Socket] Connected:", socket.id);
      setIsSocketConnected(true);
    };

    const onDisconnect = () => {
      console.log("[Socket] Disconnected");
      setIsSocketConnected(false);
    };

    const onConnectError = (err: Error) => {
      console.error("[Socket] Connection error:", err.message);
      setIsSocketConnected(false);
    };

    const resolveExamId = (payloadExamId?: string) =>
      payloadExamId ?? activeExamIdRef.current ?? undefined;

    const onStudentJoined = (payload: { examId?: string; studentId: string; studentName?: string }) => {
      const examId = resolveExamId(payload.examId);
      if (examId && payload.studentId) {
        console.log("[Socket] Student joined:", payload.studentName ?? payload.studentId);
        addConnectedStudent(examId, payload.studentId);
      }
    };

    const onStudentSubmitted = (payload: { examId?: string; studentId: string; studentName?: string }) => {
      if (!payload.studentId) return;
      console.log("[Socket] Student submitted:", payload.studentName ?? payload.studentId);
      pushActivity({
        type: "submission",
        studentId: payload.studentId,
        studentName: payload.studentName ?? payload.studentId,
        examId: resolveExamId(payload.examId),
      });
    };

    const onStudentLeft = ({ examId: payloadExamId, studentId }: { examId?: string; studentId: string }) => {
      const examId = resolveExamId(payloadExamId);
      if (examId && studentId) {
        console.log("[Socket] Student left:", studentId);
        removeConnectedStudent(examId, studentId);
      }
    };

    const onRoster = ({ examId, students }: { examId: string; students: { studentId: string }[] }) => {
      if (!examId) return;
      activeExamIdRef.current = examId;
      liveSessionService.startLiveSession(examId).then(() => {
        liveSessionService.setConnectedStudents(
          examId,
          students.map((s) => s.studentId)
        );
        syncSession(examId);
      });
    };

    const onSessionOpened = ({ examId }: { examId: string }) => {
      console.log("[Socket] Session opened:", examId);
      activeExamIdRef.current = examId;
      liveSessionService.startLiveSession(examId);
      syncSession(examId);
    };

    const onSessionClosed = ({ examId }: { examId: string }) => {
      console.log("[Socket] Session closed:", examId);
      if (activeExamIdRef.current === examId) activeExamIdRef.current = null;
      liveSessionService.endLiveSession(examId);
      setActiveSessions((prev) => {
        const next = new Map(prev);
        next.delete(examId);
        return next;
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("session:studentJoined", onStudentJoined);
    socket.on("session:studentSubmitted", onStudentSubmitted);
    socket.on("session:studentLeft", onStudentLeft);
    socket.on("session:roster", onRoster);
    socket.on("session:opened", onSessionOpened);
    socket.on("session:closed", onSessionClosed);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("session:studentJoined", onStudentJoined);
      socket.off("session:studentSubmitted", onStudentSubmitted);
      socket.off("session:studentLeft", onStudentLeft);
      socket.off("session:roster", onRoster);
      socket.off("session:opened", onSessionOpened);
      socket.off("session:closed", onSessionClosed);
      disconnectSocket();
    };
  }, [addConnectedStudent, removeConnectedStudent, syncSession]);

  // Memoized so its identity stays stable across renders. Consumers use this in
  // effect dependency arrays; an unstable identity would re-trigger those
  // effects on every provider render (which re-emits socket events) and cause
  // an infinite render/emit loop.
  const refreshSession = useCallback(async (examId: string) => {
    const session = await liveSessionService.getLiveSession(examId);
    if (session) {
      setActiveSessions((prev) => {
        const newMap = new Map(prev);
        newMap.set(examId, session);
        return newMap;
      });
    }
  }, []);

  const getSession = useCallback(
    (examId: string): LiveSession | null => activeSessions.get(examId) || null,
    [activeSessions]
  );

  return (
    <LiveSessionContext.Provider
      value={{ activeSessions, getSession, refreshSession, isSocketConnected, setActiveExamId }}
    >
      {children}
    </LiveSessionContext.Provider>
  );
}

export function useLiveSession() {
  const context = useContext(LiveSessionContext);
  if (context === undefined) {
    throw new Error("useLiveSession must be used within a LiveSessionProvider");
  }
  return context;
}

/** Re-export for pages that emit socket events */
export { getSocket };

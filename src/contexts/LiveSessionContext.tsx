"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { LiveSession } from "@/types";
import { liveSessionService } from "@/services/liveSession.service";

interface LiveSessionContextType {
  activeSessions: Map<string, LiveSession>;
  getSession: (examId: string) => LiveSession | null;
  refreshSession: (examId: string) => Promise<void>;
}

const LiveSessionContext = createContext<LiveSessionContextType | undefined>(undefined);

export function LiveSessionProvider({ children }: { children: ReactNode }) {
  const [activeSessions, setActiveSessions] = useState<Map<string, LiveSession>>(new Map());

  const refreshSession = async (examId: string) => {
    const session = await liveSessionService.getLiveSession(examId);
    if (session) {
      setActiveSessions((prev) => {
        const newMap = new Map(prev);
        newMap.set(examId, session);
        return newMap;
      });
    }
  };

  const getSession = (examId: string): LiveSession | null => {
    return activeSessions.get(examId) || null;
  };

  return (
    <LiveSessionContext.Provider value={{ activeSessions, getSession, refreshSession }}>
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

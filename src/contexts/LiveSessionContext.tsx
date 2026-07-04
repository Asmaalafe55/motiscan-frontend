"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { LiveSession } from "@/types";
import { liveSessionService } from "@/services/liveSession.service";
import { connectSocket, disconnectSocket } from "@/lib/socket";

interface LiveSessionContextType {
  activeSessions: Map<string, LiveSession>;
  getSession: (examId: string) => LiveSession | null;
  refreshSession: (examId: string) => Promise<void>;
  isSocketConnected: boolean;
}

const LiveSessionContext = createContext<LiveSessionContextType | undefined>(undefined);

export function LiveSessionProvider({ children }: { children: ReactNode }) {
  const [activeSessions, setActiveSessions] = useState<Map<string, LiveSession>>(new Map());
  const [isSocketConnected, setIsSocketConnected] = useState(false);

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

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      disconnectSocket();
    };
  }, []);

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
    <LiveSessionContext.Provider value={{ activeSessions, getSession, refreshSession, isSocketConnected }}>
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

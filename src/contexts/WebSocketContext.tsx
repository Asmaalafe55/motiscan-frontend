"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface WebSocketContextType {
  // Mock WebSocket - will be replaced with real socket.io later
  connect: (examId: string) => void;
  disconnect: () => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);

  const connect = (examId: string) => {
    // Mock connection - in real app, this would connect to socket.io server
    console.log(`[Mock] Connecting to exam ${examId}`);
    setIsConnected(true);
  };

  const disconnect = () => {
    console.log("[Mock] Disconnecting");
    setIsConnected(false);
  };

  return (
    <WebSocketContext.Provider value={{ connect, disconnect, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}

import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

let socket: Socket | null = null;

/** Returns the shared Socket.io client instance (creates it if needed). */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

/** Opens the socket connection if not already connected. */
export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

/** Closes the socket connection. */
export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

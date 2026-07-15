import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:8000";

let socket: Socket | null = null;

/**
 * Returns a shared Socket.IO client. Connection is deferred until
 * `connect()` is called so React can attach listeners first.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function getSocketUrl(): string {
  return SOCKET_URL;
}

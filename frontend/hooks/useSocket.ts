"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

import { getSocket } from "@/lib/socket";
import type { ConnectionStatus } from "@/types/chat";

interface UseSocketResult {
  socket: Socket;
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
}

export function useSocket(): UseSocketResult {
  const socketRef = useRef<Socket>(getSocket());
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    const socket = socketRef.current;

    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("disconnected");
    const onReconnectAttempt = () => setStatus("reconnecting");
    const onReconnect = () => setStatus("connected");
    const onConnectError = () => {
      setStatus((current) =>
        current === "connected" ? "reconnecting" : "disconnected",
      );
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect", onReconnect);
    socket.on("connect_error", onConnectError);

    if (socket.connected) {
      setStatus("connected");
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.io.off("reconnect", onReconnect);
      socket.off("connect_error", onConnectError);
    };
  }, []);

  const connect = useCallback(() => {
    const socket = socketRef.current;
    if (!socket.connected) {
      setStatus("connecting");
      socket.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    const socket = socketRef.current;
    if (socket.connected) {
      socket.disconnect();
    }
    setStatus("disconnected");
  }, []);

  return {
    socket: socketRef.current,
    status,
    connect,
    disconnect,
  };
}

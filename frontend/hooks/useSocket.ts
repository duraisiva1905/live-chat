"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";

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
  const everConnected = useRef(false);
  const statusRef = useRef<ConnectionStatus>("disconnected");

  useEffect(() => {
    const socket = socketRef.current;

    const onConnect = () => {
      const wasReconnect = everConnected.current;
      everConnected.current = true;
      statusRef.current = "connected";
      setStatus("connected");
      if (wasReconnect) {
        toast.success("Reconnected");
      } else {
        toast.success("Connected");
      }
    };

    const onDisconnect = () => {
      statusRef.current = "disconnected";
      setStatus("disconnected");
      toast.error("Connection lost");
    };

    const onReconnectAttempt = () => {
      statusRef.current = "reconnecting";
      setStatus("reconnecting");
    };

    const onReconnect = () => {
      statusRef.current = "connected";
      setStatus("connected");
      toast.success("Reconnected");
    };

    const onConnectError = () => {
      setStatus((current) => {
        const next =
          current === "connected" || current === "reconnecting"
            ? "reconnecting"
            : "disconnected";
        statusRef.current = next;
        return next;
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect", onReconnect);
    socket.on("connect_error", onConnectError);

    if (socket.connected) {
      statusRef.current = "connected";
      setStatus("connected");
      everConnected.current = true;
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
      statusRef.current = "connecting";
      socket.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    const socket = socketRef.current;
    if (socket.connected) {
      socket.disconnect();
    }
    setStatus("disconnected");
    statusRef.current = "disconnected";
  }, []);

  return {
    socket: socketRef.current,
    status,
    connect,
    disconnect,
  };
}

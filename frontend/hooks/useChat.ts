"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useSocket } from "@/hooks/useSocket";
import type {
  ChatMessage,
  ConnectionStatus,
  MessageHistoryPayload,
  RoomUsersPayload,
  SocketErrorPayload,
  UserEventPayload,
} from "@/types/chat";

interface UseChatResult {
  username: string;
  room: string;
  joined: boolean;
  messages: ChatMessage[];
  users: string[];
  status: ConnectionStatus;
  joining: boolean;
  error: string | null;
  clearError: () => void;
  join: (username: string, room: string) => void;
  leave: () => void;
  sendMessage: (content: string) => void;
}

function messageKey(message: ChatMessage): string {
  if (message.id != null) {
    return `id-${message.id}`;
  }
  return `local-${message.created_at}-${message.username}-${message.content}`;
}

export function useChat(): UseChatResult {
  const { socket, status, connect, disconnect } = useSocket();
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingJoin = useRef<{ username: string; room: string } | null>(null);
  const seenKeys = useRef<Set<string>>(new Set());

  const clearError = useCallback(() => setError(null), []);

  const appendMessage = useCallback((message: ChatMessage) => {
    const key = messageKey(message);
    if (seenKeys.current.has(key)) {
      return;
    }
    seenKeys.current.add(key);
    setMessages((prev) => [...prev, message]);
  }, []);

  const resetSession = useCallback(() => {
    setJoined(false);
    setUsername("");
    setRoom("");
    setMessages([]);
    setUsers([]);
    setJoining(false);
    seenKeys.current.clear();
    pendingJoin.current = null;
  }, []);

  useEffect(() => {
    const onHistory = (payload: MessageHistoryPayload) => {
      seenKeys.current.clear();
      const next: ChatMessage[] = [];
      for (const message of payload.messages) {
        const key = messageKey(message);
        seenKeys.current.add(key);
        next.push(message);
      }
      setMessages(next);
      setJoined(true);
      setJoining(false);
      pendingJoin.current = null;
    };

    const onNewMessage = (message: ChatMessage) => {
      appendMessage(message);
    };

    const onRoomUsers = (payload: RoomUsersPayload) => {
      setUsers(payload.users);
      if (pendingJoin.current && payload.room === pendingJoin.current.room) {
        setRoom(payload.room);
        setUsername(pendingJoin.current.username);
      }
    };

    const onUserJoined = (_payload: UserEventPayload) => {
      // room_users carries the authoritative list
    };

    const onUserLeft = (_payload: UserEventPayload) => {
      // room_users carries the authoritative list
    };

    const onError = (payload: SocketErrorPayload) => {
      setError(payload.message);
      setJoining(false);
      pendingJoin.current = null;
    };

    const onConnect = () => {
      const pending = pendingJoin.current;
      if (pending && !joined) {
        socket.emit("join_room", {
          username: pending.username,
          room: pending.room,
        });
      }
    };

    socket.on("message_history", onHistory);
    socket.on("new_message", onNewMessage);
    socket.on("room_users", onRoomUsers);
    socket.on("user_joined", onUserJoined);
    socket.on("user_left", onUserLeft);
    socket.on("error", onError);
    socket.on("connect", onConnect);

    return () => {
      socket.off("message_history", onHistory);
      socket.off("new_message", onNewMessage);
      socket.off("room_users", onRoomUsers);
      socket.off("user_joined", onUserJoined);
      socket.off("user_left", onUserLeft);
      socket.off("error", onError);
      socket.off("connect", onConnect);
    };
  }, [appendMessage, joined, socket]);

  const join = useCallback(
    (nextUsername: string, nextRoom: string) => {
      const usernameValue = nextUsername.trim();
      const roomValue = nextRoom.trim();
      if (!usernameValue || !roomValue) {
        setError("Username and room are required");
        return;
      }

      setError(null);
      setJoining(true);
      setUsername(usernameValue);
      setRoom(roomValue);
      pendingJoin.current = { username: usernameValue, room: roomValue };

      if (socket.connected) {
        socket.emit("join_room", {
          username: usernameValue,
          room: roomValue,
        });
      } else {
        connect();
      }
    },
    [connect, socket],
  );

  const leave = useCallback(() => {
    if (socket.connected) {
      socket.emit("leave_room", {});
    }
    resetSession();
    disconnect();
  }, [disconnect, resetSession, socket]);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !joined) {
        return;
      }
      if (status !== "connected") {
        setError("Not connected. Wait for reconnection and try again.");
        return;
      }
      socket.emit("send_message", { content: trimmed });
    },
    [joined, socket, status],
  );

  return {
    username,
    room,
    joined,
    messages,
    users,
    status,
    joining,
    error,
    clearError,
    join,
    leave,
    sendMessage,
  };
}

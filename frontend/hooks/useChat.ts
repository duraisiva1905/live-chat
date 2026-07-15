"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { fetchRooms } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import type {
  ChatMessage,
  ConnectionStatus,
  MessageHistoryPayload,
  RoomListPayload,
  RoomSummary,
  RoomUsersPayload,
  SocketErrorPayload,
  TypingPayload,
  UserEventPayload,
  UserOut,
} from "@/types/chat";

interface UseChatResult {
  username: string;
  room: string;
  joined: boolean;
  messages: ChatMessage[];
  users: UserOut[];
  rooms: RoomSummary[];
  roomsLoading: boolean;
  typingUsers: string[];
  status: ConnectionStatus;
  joining: boolean;
  creating: boolean;
  error: string | null;
  errorCode: string | null;
  successMessage: string | null;
  clearError: () => void;
  clearSuccess: () => void;
  connectLobby: () => void;
  createRoom: (roomName: string) => void;
  join: (username: string, room: string) => void;
  leave: () => void;
  sendMessage: (content: string) => void;
  notifyTyping: () => void;
  stopTyping: () => void;
}

function messageKey(message: ChatMessage): string {
  if (message.message_id != null) {
    return `id-${message.message_id}`;
  }
  return `local-${message.timestamp}-${message.sender}-${message.text}`;
}

export function useChat(): UseChatResult {
  const { socket, status, connect, disconnect } = useSocket();
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<UserOut[]>([]);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const pendingJoin = useRef<{ username: string; room: string } | null>(null);
  const pendingCreate = useRef<string | null>(null);
  const seenKeys = useRef<Set<string>>(new Set());
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  const clearSuccess = useCallback(() => setSuccessMessage(null), []);

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
    setTypingUsers([]);
    setJoining(false);
    seenKeys.current.clear();
    pendingJoin.current = null;
    isTyping.current = false;
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }
  }, []);

  const hydrateRooms = useCallback(async () => {
    try {
      setRoomsLoading(true);
      const data = await fetchRooms();
      setRooms(data);
    } catch {
      // Socket list updates will still arrive when connected.
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  const connectLobby = useCallback(() => {
    void hydrateRooms();
    connect();
  }, [connect, hydrateRooms]);

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
      if (pendingJoin.current) {
        setUsername(pendingJoin.current.username);
        setRoom(payload.room);
      }
      pendingJoin.current = null;
    };

    const onNewMessage = (message: ChatMessage) => {
      appendMessage(message);
    };

    const onRoomUsers = (payload: RoomUsersPayload) => {
      setUsers(payload.users);
    };

    const onUserJoined = (_payload: UserEventPayload) => {};
    const onUserLeft = (payload: UserEventPayload) => {
      setTypingUsers((prev) => prev.filter((name) => name !== payload.username));
    };

    const onRoomList = (payload: RoomListPayload) => {
      setRooms(payload.rooms);
      setRoomsLoading(false);
    };

    const onRoomCreated = (payload: RoomSummary) => {
      setCreating(false);
      pendingCreate.current = null;
      setSuccessMessage(`Room "${payload.room_name}" created successfully`);
      toast.success(`Room "${payload.room_name}" created`);
    };

    const onTyping = (payload: TypingPayload) => {
      setTypingUsers((prev) =>
        prev.includes(payload.username) ? prev : [...prev, payload.username],
      );
    };

    const onStopTyping = (payload: TypingPayload) => {
      setTypingUsers((prev) => prev.filter((name) => name !== payload.username));
    };

    const onError = (payload: SocketErrorPayload) => {
      setError(payload.message);
      setErrorCode(payload.code ?? null);
      setJoining(false);
      setCreating(false);
      pendingJoin.current = null;
      pendingCreate.current = null;
      toast.error(payload.message);
    };

    const onConnect = () => {
      const pending = pendingJoin.current;
      if (pending && !joined) {
        socket.emit("join_room", {
          username: pending.username,
          room: pending.room,
        });
      }
      const createPending = pendingCreate.current;
      if (createPending) {
        socket.emit("create_room", { room_name: createPending });
      }
    };

    socket.on("message_history", onHistory);
    socket.on("new_message", onNewMessage);
    socket.on("room_users", onRoomUsers);
    socket.on("user_joined", onUserJoined);
    socket.on("user_left", onUserLeft);
    socket.on("room_list_updated", onRoomList);
    socket.on("room_created", onRoomCreated);
    socket.on("typing", onTyping);
    socket.on("stop_typing", onStopTyping);
    socket.on("error", onError);
    socket.on("connect", onConnect);

    return () => {
      socket.off("message_history", onHistory);
      socket.off("new_message", onNewMessage);
      socket.off("room_users", onRoomUsers);
      socket.off("user_joined", onUserJoined);
      socket.off("user_left", onUserLeft);
      socket.off("room_list_updated", onRoomList);
      socket.off("room_created", onRoomCreated);
      socket.off("typing", onTyping);
      socket.off("stop_typing", onStopTyping);
      socket.off("error", onError);
      socket.off("connect", onConnect);
    };
  }, [appendMessage, joined, socket]);

  const createRoom = useCallback(
    (roomName: string) => {
      const cleaned = roomName.trim();
      if (!cleaned) {
        setError("Room name is required");
        setErrorCode("validation_error");
        return;
      }
      clearError();
      setCreating(true);
      pendingCreate.current = cleaned;
      if (socket.connected) {
        socket.emit("create_room", { room_name: cleaned });
      } else {
        connect();
      }
    },
    [clearError, connect, socket],
  );

  const join = useCallback(
    (nextUsername: string, nextRoom: string) => {
      const usernameValue = nextUsername.trim();
      const roomValue = nextRoom.trim();
      if (!usernameValue || !roomValue) {
        setError("Username and room are required");
        setErrorCode("validation_error");
        return;
      }

      clearError();
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
    [clearError, connect, socket],
  );

  const stopTyping = useCallback(() => {
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }
    if (isTyping.current && socket.connected && joined) {
      socket.emit("stop_typing", {});
      isTyping.current = false;
    }
  }, [joined, socket]);

  const leave = useCallback(() => {
    stopTyping();
    if (socket.connected) {
      socket.emit("leave_room", {});
    }
    resetSession();
  }, [resetSession, socket, stopTyping]);

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
      stopTyping();
      socket.emit("send_message", { content: trimmed });
    },
    [joined, socket, status, stopTyping],
  );

  const notifyTyping = useCallback(() => {
    if (!joined || status !== "connected") {
      return;
    }
    if (!isTyping.current) {
      socket.emit("typing", {});
      isTyping.current = true;
    }
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }
    typingTimer.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  }, [joined, socket, status, stopTyping]);

  return {
    username,
    room,
    joined,
    messages,
    users,
    rooms,
    roomsLoading,
    typingUsers,
    status,
    joining,
    creating,
    error,
    errorCode,
    successMessage,
    clearError,
    clearSuccess,
    connectLobby,
    createRoom,
    join,
    leave,
    sendMessage,
    notifyTyping,
    stopTyping,
  };
}

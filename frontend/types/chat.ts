/** Shared chat domain types mirroring backend Socket.IO payloads. */

export type MessageType = "user" | "system";

export interface ChatMessage {
  id: number | null;
  username: string;
  content: string;
  message_type: MessageType;
  room: string;
  created_at: string;
}

export interface JoinRoomPayload {
  username: string;
  room: string;
}

export interface SendMessagePayload {
  content: string;
}

export interface RoomUsersPayload {
  room: string;
  users: string[];
}

export interface UserEventPayload {
  username: string;
  room: string;
}

export interface MessageHistoryPayload {
  room: string;
  messages: ChatMessage[];
}

export interface SocketErrorPayload {
  message: string;
  code?: string | null;
}

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

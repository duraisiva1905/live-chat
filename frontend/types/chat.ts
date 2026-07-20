/** Shared chat domain types mirroring backend Socket.IO / REST payloads. */

export type MessageType = "chat" | "system";

export interface ChatMessage {
  message_id: number | null;
  sender: string;
  text: string;
  timestamp: string;
  type: MessageType;
  room: string;
}

export interface RoomSummary {
  room_id: number;
  room_name: string;
  created_at: string;
  created_by: string;
  active_users: number;
}

export interface UserOut {
  username: string;
  socket_id: string;
  joined_at: string;
}

export interface JoinRoomPayload {
  username: string;
  room: string;
}

export interface CreateRoomPayload {
  room_name: string;
  created_by: string;
}

export interface SendMessagePayload {
  content: string;
}

export interface RoomUsersPayload {
  room: string;
  users: UserOut[];
}

export interface UserEventPayload {
  username: string;
  room: string;
}

export interface TypingPayload {
  username: string;
  room: string;
}

export interface MessageHistoryPayload {
  room: string;
  created_by?: string;
  messages: ChatMessage[];
}

export interface RoomListPayload {
  rooms: RoomSummary[];
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

  export interface UsersIn {
    users:UserOut[]
  }
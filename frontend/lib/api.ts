import type { RoomSummary, UserOut, UsersIn, ChatMessage } from "@/types/chat";

const API_BASE =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:8000";

export function getApiBase(): string {
  return API_BASE;
}

export async function fetchRooms(): Promise<RoomSummary[]> {
  const response = await fetch(`${API_BASE}/rooms`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load rooms");
  }
  return response.json() as Promise<RoomSummary[]>;
}

export async function fetchRoomUsers(roomName: string): Promise<UserOut[]> {
  const response = await fetch(
    `${API_BASE}/rooms/${encodeURIComponent(roomName)}/users`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error("Failed to load room users");
  }
  return response.json() as Promise<UserOut[]>;
}

export async function fetchUsers(): Promise<UserOut[]> {
  const response = await fetch(
    `${API_BASE}/users`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error("Failed to load room users");
  }
  return response.json() as Promise<UserOut[]>;
}

export async function fetchMessagesCount(count: number, roomName: string): Promise<ChatMessage[]> 
{
  const response = await fetch(
    `${API_BASE}/messages/${encodeURIComponent(roomName)}/${count}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error("Failed to load room users");
  }
  return response.json() as Promise<ChatMessage[]>;

}

// export async function fetchUsers(): Promise<UsersIn[]> {
//   const response = await fetch(`${API_BASE}/users`, {
//     cache: "no-store",
//   });
//   if (!response.ok) {
//     throw new Error("Failed to load users");
//   }
//   return response.json() as Promise<UsersIn[]>;
// }
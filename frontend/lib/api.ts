import type { RoomSummary, UserOut } from "@/types/chat";

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

"use client";

import { Hash, Loader2 } from "lucide-react";

import { RoomCard } from "@/components/chat/RoomCard";
import { Separator } from "@/components/ui/separator";
import type { RoomSummary } from "@/types/chat";
import { cn } from "@/lib/utils";

interface RoomListProps {
  rooms: RoomSummary[];
  loading?: boolean;
  selectedRoom?: string;
  onSelect: (roomName: string) => void;
  className?: string;
  title?: string;
}

export function RoomList({
  rooms,
  loading = false,
  selectedRoom,
  onSelect,
  className,
  title = "Rooms",
}: RoomListProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col bg-sidebar text-sidebar-foreground",
        className,
      )}
      aria-label="Available rooms"
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <Hash className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h2>
      </div>
      <Separator />
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading rooms…
          </div>
        ) : rooms.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            No active rooms available
          </p>
        ) : (
          <ul className="space-y-1.5" role="list">
            {rooms.map((room) => (
              <li key={room.room_id}>
                <RoomCard
                  room={room}
                  selected={selectedRoom === room.room_name}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

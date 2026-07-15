"use client";

import type { RoomSummary } from "@/types/chat";
import { cn } from "@/lib/utils";

interface RoomCardProps {
  room: RoomSummary;
  selected?: boolean;
  onSelect: (roomName: string) => void;
}

function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function RoomCard({ room, selected = false, onSelect }: RoomCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(room.room_name)}
      className={cn(
        "w-full rounded-xl border px-3 py-2.5 text-left shadow-sm transition-all",
        "hover:border-primary/40 hover:bg-sidebar-accent",
        selected
          ? "border-primary/50 bg-sidebar-accent"
          : "border-transparent bg-transparent",
      )}
      aria-pressed={selected}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium text-sidebar-foreground">
          #{room.room_name}
        </span>
        <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-400">
          {room.active_users}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Created {formatCreatedAt(room.created_at)}
      </p>
    </button>
  );
}

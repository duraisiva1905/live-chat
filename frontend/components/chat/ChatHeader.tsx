"use client";

import { Hash, LogOut, Menu, Users } from "lucide-react";

import { ConnectionBadge } from "@/components/chat/ConnectionBadge";
import { Button } from "@/components/ui/button";
import type { ConnectionStatus } from "@/types/chat";

interface ChatHeaderProps {
  room: string;
  username: string;
  status: ConnectionStatus;
  onLeave: () => void;
  onOpenRooms?: () => void;
  onOpenUsers?: () => void;
}

export function ChatHeader({
  room,
  username,
  status,
  onLeave,
  onOpenRooms,
  onOpenUsers,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center gap-2 border-b border-border bg-card/50 px-3 py-2.5 backdrop-blur md:px-5">
      {onOpenRooms ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          aria-label="Open rooms"
          onClick={onOpenRooms}
        >
          <Menu />
        </Button>
      ) : null}

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Hash className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-foreground">
            {room}
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            Signed in as {username}
          </p>
        </div>
      </div>

      <ConnectionBadge status={status} />

      {onOpenUsers ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Open online users"
          onClick={onOpenUsers}
        >
          <Users />
        </Button>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onLeave}
        aria-label="Leave room"
      >
        <LogOut />
        <span className="hidden sm:inline">Leave</span>
      </Button>
    </header>
  );
}

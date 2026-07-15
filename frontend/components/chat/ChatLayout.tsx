"use client";

import { useState } from "react";
import { Hash, LogOut, Menu, X } from "lucide-react";

import { ConnectionStatusBadge } from "@/components/chat/ConnectionStatus";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { OnlineUsers } from "@/components/chat/OnlineUsers";
import { Button } from "@/components/ui/button";
import type { ChatMessage, ConnectionStatus } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  username: string;
  room: string;
  messages: ChatMessage[];
  users: string[];
  status: ConnectionStatus;
  error: string | null;
  onClearError: () => void;
  onLeave: () => void;
  onSend: (content: string) => void;
}

export function ChatLayout({
  username,
  room,
  messages,
  users,
  status,
  error,
  onClearError,
  onLeave,
  onSend,
}: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const canSend = status === "connected";

  return (
    <div className="relative flex h-dvh min-h-0 overflow-hidden bg-background">
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border transition-transform md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <OnlineUsers
          users={users}
          currentUsername={username}
          className="h-full"
        />
      </div>

      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-label="Close users sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card/50 px-3 py-2.5 backdrop-blur md:px-5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Open online users"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu />
          </Button>

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

          <ConnectionStatusBadge status={status} />

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

          {sidebarOpen ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              <X />
            </Button>
          ) : null}
        </header>

        {error ? (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive"
          >
            <p>{error}</p>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onClearError}
              aria-label="Dismiss error"
            >
              Dismiss
            </Button>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col">
          <MessageList messages={messages} currentUsername={username} />
          <MessageInput
            onSend={onSend}
            disabled={!canSend}
            placeholder={
              canSend
                ? `Message #${room}`
                : "Waiting for connection…"
            }
          />
        </div>
      </div>
    </div>
  );
}

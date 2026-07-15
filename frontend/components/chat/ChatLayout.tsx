"use client";

import { useState } from "react";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageList } from "@/components/chat/MessageList";
import { OnlineUsers } from "@/components/chat/OnlineUsers";
import { RoomList } from "@/components/chat/RoomList";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import type {
  ChatMessage,
  ConnectionStatus,
  RoomSummary,
  UserOut,
} from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  username: string;
  room: string;
  roomCreatedBy: string;
  messages: ChatMessage[];
  users: UserOut[];
  rooms: RoomSummary[];
  roomsLoading: boolean;
  typingUsers: string[];
  status: ConnectionStatus;
  error: string | null;
  onClearError: () => void;
  onLeave: () => void;
  onSend: (content: string) => void;
  onTyping: () => void;
  onSelectRoom: (roomName: string) => void;
}

export function ChatLayout({
  username,
  room,
  roomCreatedBy,
  messages,
  users,
  rooms,
  roomsLoading,
  typingUsers,
  status,
  error,
  onClearError,
  onLeave,
  onSend,
  onTyping,
  onSelectRoom,
}: ChatLayoutProps) {
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const canSend = status === "connected";

  return (
    <div className="relative flex h-dvh min-h-0 overflow-hidden bg-background">
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0",
          roomsOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <RoomList
          rooms={rooms}
          loading={roomsLoading}
          selectedRoom={room}
          onSelect={(name) => {
            onSelectRoom(name);
            setRoomsOpen(false);
          }}
        />
      </div>

      {roomsOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-label="Close rooms sidebar"
          onClick={() => setRoomsOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          room={room}
          username={username}
          createdBy={roomCreatedBy}
          status={status}
          onLeave={onLeave}
          onOpenRooms={() => setRoomsOpen(true)}
          onOpenUsers={() => setUsersOpen(true)}
        />

        {error ? (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive"
          >
            <p>{error}</p>
            <button
              type="button"
              className="text-xs underline"
              onClick={onClearError}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <MessageList messages={messages} currentUsername={username} />
            <TypingIndicator usernames={typingUsers} />
            <ChatInput
              onSend={onSend}
              onTyping={onTyping}
              disabled={!canSend}
              placeholder={
                canSend ? `Message #${room}` : "Waiting for connection…"
              }
            />
          </div>

          <div
            className={cn(
              "fixed inset-y-0 right-0 z-40 w-64 border-l border-sidebar-border bg-sidebar transition-transform md:static md:translate-x-0",
              usersOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
            )}
          >
            <OnlineUsers users={users} currentUsername={username} />
          </div>
        </div>
      </div>

      {usersOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-label="Close users sidebar"
          onClick={() => setUsersOpen(false)}
        />
      ) : null}
    </div>
  );
}

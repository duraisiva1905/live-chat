"use client";

import { useEffect, useRef } from "react";

import { EmptyState } from "@/components/chat/EmptyState";
import { MessageItem } from "@/components/chat/MessageItem";
import type { ChatMessage } from "@/types/chat";

interface MessageListProps {
  messages: ChatMessage[];
  currentUsername: string;
}

export function MessageList({ messages, currentUsername }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <EmptyState
        title="No messages yet"
        description="Say hello to start the conversation. Messages stay in this room for everyone who joins later."
      />
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div
        className="flex flex-col gap-1 px-3 py-4 md:px-5"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Chat messages"
      >
        {messages.map((message, index) => (
          <MessageItem
            key={
              message.id != null
                ? `msg-${message.id}`
                : `msg-${index}-${message.created_at}`
            }
            message={message}
            isOwn={
              message.message_type === "user" &&
              message.username === currentUsername
            }
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

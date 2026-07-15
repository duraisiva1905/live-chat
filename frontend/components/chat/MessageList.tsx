"use client";

import { MessageBubble } from "@/components/chat/MessageBubble";
import { useSmartScroll } from "@/hooks/useSmartScroll";
import type { ChatMessage } from "@/types/chat";

interface MessageListProps {
  messages: ChatMessage[];
  currentUsername: string;
}

export function MessageList({ messages, currentUsername }: MessageListProps) {
  const { containerRef, bottomRef, handleScroll } = useSmartScroll(messages);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <p className="text-sm font-medium text-foreground">
          No messages yet. Start the conversation 👋
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="sleek-scroll min-h-0 flex-1 overflow-y-auto"
    >
      <div
        className="flex flex-col gap-1 px-3 py-4 md:px-5"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Chat messages"
      >
        {messages.map((message, index) => (
          <MessageBubble
            key={
              message.message_id != null
                ? `msg-${message.message_id}`
                : `msg-${index}-${message.timestamp}`
            }
            message={message}
            isOwn={
              message.type === "chat" && message.sender === currentUsername
            }
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

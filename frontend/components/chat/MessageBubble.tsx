"use client";

import type { ChatMessage } from "@/types/chat";
import { UserAvatar } from "@/components/chat/UserAvatar";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  if (message.type === "system") {
    return (
      <div role="status" className="flex flex-col items-center gap-1 px-4 py-2">
        <div className="w-full max-w-sm border-t border-border/60" aria-hidden />
        <p className="text-center text-xs text-muted-foreground">
          {message.text}
          <span className="ml-2 text-muted-foreground/70">
            {formatTime(message.timestamp)}
          </span>
        </p>
        <div className="w-full max-w-sm border-t border-border/60" aria-hidden />
      </div>
    );
  }

  return (
    <article
      className={cn(
        "group flex gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/40",
        isOwn && "bg-primary/5 hover:bg-primary/10",
      )}
      aria-label={`Message from ${message.sender}`}
    >
      <UserAvatar username={message.sender} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-foreground">
            {message.sender}
          </span>
          <time
            dateTime={message.timestamp}
            className="text-xs text-muted-foreground"
          >
            {formatTime(message.timestamp)}
          </time>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
          {message.text}
        </p>
      </div>
    </article>
  );
}

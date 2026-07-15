"use client";

import type { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function avatarTone(name: string): string {
  const tones = [
    "bg-sky-500/25 text-sky-200",
    "bg-violet-500/25 text-violet-200",
    "bg-emerald-500/25 text-emerald-200",
    "bg-amber-500/25 text-amber-200",
    "bg-rose-500/25 text-rose-200",
    "bg-cyan-500/25 text-cyan-200",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % tones.length;
  }
  return tones[hash] ?? tones[0];
}

export function MessageItem({ message, isOwn }: MessageItemProps) {
  if (message.message_type === "system") {
    return (
      <div
        role="status"
        className="flex justify-center px-2 py-1"
      >
        <p className="rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
          {message.content}
          <span className="ml-2 opacity-70">{formatTime(message.created_at)}</span>
        </p>
      </div>
    );
  }

  const initial = message.username.charAt(0).toUpperCase() || "?";

  return (
    <article
      className={cn(
        "group flex gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/40",
        isOwn && "bg-primary/5 hover:bg-primary/10",
      )}
      aria-label={`Message from ${message.username}`}
    >
      <div
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
          avatarTone(message.username),
        )}
        aria-hidden
      >
        {initial}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-foreground">
            {message.username}
          </span>
          <time
            dateTime={message.created_at}
            className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          >
            {formatTime(message.created_at)}
          </time>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
          {message.content}
        </p>
      </div>
    </article>
  );
}

"use client";

import { cn } from "@/lib/utils";

const TONES = [
  "bg-sky-500/25 text-sky-200",
  "bg-violet-500/25 text-violet-200",
  "bg-emerald-500/25 text-emerald-200",
  "bg-amber-500/25 text-amber-200",
  "bg-rose-500/25 text-rose-200",
  "bg-cyan-500/25 text-cyan-200",
];

function avatarTone(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % TONES.length;
  }
  return TONES[hash] ?? TONES[0];
}

interface UserAvatarProps {
  username: string;
  size?: "sm" | "md";
  className?: string;
}

export function UserAvatar({
  username,
  size = "md",
  className,
}: UserAvatarProps) {
  const initial = username.charAt(0).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg font-semibold",
        size === "sm" ? "size-7 text-xs" : "size-9 text-sm",
        avatarTone(username),
        className,
      )}
      aria-hidden
    >
      {initial}
    </div>
  );
}

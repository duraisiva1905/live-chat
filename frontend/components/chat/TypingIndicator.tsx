"use client";

interface TypingIndicatorProps {
  usernames: string[];
}

export function TypingIndicator({ usernames }: TypingIndicatorProps) {
  if (usernames.length === 0) {
    return null;
  }

  let label: string;
  if (usernames.length === 1) {
    label = `${usernames[0]} is typing…`;
  } else if (usernames.length === 2) {
    label = `${usernames[0]} and ${usernames[1]} are typing…`;
  } else {
    label = `${usernames[0]} and ${usernames.length - 1} others are typing…`;
  }

  return (
    <p
      className="px-4 py-1 text-xs text-muted-foreground italic animate-pulse"
      aria-live="polite"
    >
      {label}
    </p>
  );
}

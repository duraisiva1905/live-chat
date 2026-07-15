"use client";

import type { ConnectionStatus } from "@/types/chat";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connected: "🟢 Connected",
  connecting: "🟡 Reconnecting",
  reconnecting: "🟡 Reconnecting",
  disconnected: "🔴 Disconnected",
};

interface ConnectionBadgeProps {
  status: ConnectionStatus;
}

export function ConnectionBadge({ status }: ConnectionBadgeProps) {
  const isLive = status === "connected";
  const isPending = status === "connecting" || status === "reconnecting";

  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1.5 font-normal",
        isLive && "bg-emerald-500/15 text-emerald-400",
        isPending && "bg-amber-500/15 text-amber-300",
        status === "disconnected" && "bg-destructive/15 text-destructive",
      )}
      aria-live="polite"
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

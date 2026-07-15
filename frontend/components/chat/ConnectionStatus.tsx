"use client";

import type { ConnectionStatus } from "@/types/chat";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connected: "Connected",
  connecting: "Connecting",
  reconnecting: "Reconnecting",
  disconnected: "Disconnected",
};

interface ConnectionStatusProps {
  status: ConnectionStatus;
}

export function ConnectionStatusBadge({ status }: ConnectionStatusProps) {
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
      <span
        className={cn(
          "size-1.5 rounded-full",
          isLive && "bg-emerald-400",
          isPending && "animate-pulse bg-amber-300",
          status === "disconnected" && "bg-destructive",
        )}
        aria-hidden
      />
      {STATUS_LABEL[status]}
    </Badge>
  );
}

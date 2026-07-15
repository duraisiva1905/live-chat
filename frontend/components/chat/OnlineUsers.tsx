"use client";

import { Users } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface OnlineUsersProps {
  users: string[];
  currentUsername: string;
  className?: string;
}

export function OnlineUsers({
  users,
  currentUsername,
  className,
}: OnlineUsersProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col bg-sidebar text-sidebar-foreground",
        className,
      )}
      aria-label="Online users"
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <Users className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Online — {users.length}
        </h2>
      </div>
      <Separator />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {users.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No one else is here yet.
          </p>
        ) : (
          <ul className="space-y-1 p-2" role="list">
            {users.map((name) => {
              const isSelf = name === currentUsername;
              return (
                <li
                  key={name}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                    isSelf && "bg-sidebar-accent",
                  )}
                >
                  <span
                    className="size-2 shrink-0 rounded-full bg-emerald-400"
                    aria-hidden
                  />
                  <span className="truncate">
                    {name}
                    {isSelf ? (
                      <span className="text-muted-foreground"> (you)</span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

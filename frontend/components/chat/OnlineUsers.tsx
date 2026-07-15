"use client";

import { Users } from "lucide-react";

import { UserAvatar } from "@/components/chat/UserAvatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { UserOut } from "@/types/chat";
import { cn } from "@/lib/utils";

interface OnlineUsersProps {
  users: UserOut[];
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
      <div className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-sidebar-border/80 bg-sidebar/95 px-4 py-3 backdrop-blur-md">
        <Users className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Online — {users.length}
        </h2>
      </div>
      <ScrollArea className="min-h-0 flex-1 overflow-hidden">
        {users.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No users online
          </p>
        ) : (
          <ul className="space-y-1 p-2" role="list">
            {users.map((user) => {
              const isSelf = user.username === currentUsername;
              return (
                <li
                  key={user.socket_id}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    isSelf && "bg-sidebar-accent",
                  )}
                >
                  <UserAvatar username={user.username} size="sm" />
                  <span className="truncate">
                    {user.username}
                    {isSelf ? (
                      <span className="text-muted-foreground"> (you)</span>
                    ) : null}
                  </span>
                  <span
                    className="ml-auto size-2 shrink-0 rounded-full bg-emerald-400"
                    aria-hidden
                  />
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </aside>
  );
}

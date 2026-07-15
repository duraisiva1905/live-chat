"use client";

import { Users } from "lucide-react";

import { UserAvatar } from "@/components/chat/UserAvatar";
import { Separator } from "@/components/ui/separator";
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
      </div>
    </aside>
  );
}

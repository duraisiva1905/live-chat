"use client";

import { useState, type FormEvent } from "react";
import { Loader2, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface JoinFormProps {
  onJoin: (username: string, room: string) => void;
  joining: boolean;
  error: string | null;
  onClearError: () => void;
}

export function JoinForm({
  onJoin,
  joining,
  error,
  onClearError,
}: JoinFormProps) {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onJoin(username, room);
  };

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-[radial-gradient(ellipse_at_top,_oklch(0.28_0.04_250)_0%,_var(--background)_55%)] px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <MessageSquare className="size-6" aria-hidden />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Live Chat
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter a display name and room to start messaging in real time.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-border bg-card/80 p-6 shadow-xl backdrop-blur"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              autoComplete="nickname"
              placeholder="e.g. alex"
              value={username}
              onChange={(event) => {
                onClearError();
                setUsername(event.target.value);
              }}
              maxLength={50}
              required
              disabled={joining}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "join-error" : undefined}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="room">Room</Label>
            <Input
              id="room"
              name="room"
              autoComplete="off"
              placeholder="e.g. general"
              value={room}
              onChange={(event) => {
                onClearError();
                setRoom(event.target.value);
              }}
              maxLength={100}
              required
              disabled={joining}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "join-error" : undefined}
            />
          </div>

          {error ? (
            <p
              id="join-error"
              role="alert"
              className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={joining || !username.trim() || !room.trim()}
          >
            {joining ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Joining…
              </>
            ) : (
              "Join room"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

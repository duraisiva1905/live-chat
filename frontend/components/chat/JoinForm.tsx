"use client";

import { useState, type FormEvent } from "react";
import { Loader2, MessageSquare, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface JoinFormProps {
  roomValue: string;
  onRoomChange: (room: string) => void;
  onJoin: (username: string, room: string) => void;
  onCreateRoom: (room: string) => void;
  joining: boolean;
  creating: boolean;
  error: string | null;
  errorCode: string | null;
  successMessage: string | null;
  onClearError: () => void;
  onClearSuccess: () => void;
}

export function JoinForm({
  roomValue,
  onRoomChange,
  onJoin,
  onCreateRoom,
  joining,
  creating,
  error,
  errorCode,
  successMessage,
  onClearError,
  onClearSuccess,
}: JoinFormProps) {
  const [username, setUsername] = useState("");

  const handleJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onJoin(username, roomValue);
  };

  const handleCreate = () => {
    onClearError();
    onClearSuccess();
    onCreateRoom(roomValue);
  };

  const showCreateHint = errorCode === "room_not_found";

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-3 text-center lg:text-left">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary lg:mx-0">
          <MessageSquare className="size-6" aria-hidden />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Live Chat
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick an active room or create a new one, then join with your display
          name.
        </p>
      </div>

      <form
        onSubmit={handleJoin}
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
            disabled={joining || creating}
            aria-invalid={Boolean(error)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="room">Room</Label>
          <Input
            id="room"
            name="room"
            autoComplete="off"
            placeholder="e.g. general"
            value={roomValue}
            onChange={(event) => {
              onClearError();
              onClearSuccess();
              onRoomChange(event.target.value);
            }}
            maxLength={100}
            required
            disabled={joining || creating}
            aria-invalid={Boolean(error)}
          />
        </div>

        {successMessage ? (
          <p
            role="status"
            className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-400"
          >
            {successMessage}
          </p>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="space-y-2 rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive"
          >
            <p>{error}</p>
            {showCreateHint ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCreate}
                disabled={creating || !roomValue.trim()}
              >
                {creating ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden />
                    Creating…
                  </>
                ) : (
                  <>
                    <Plus />
                    Create this room
                  </>
                )}
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="submit"
            className="flex-1"
            size="lg"
            disabled={joining || creating || !username.trim() || !roomValue.trim()}
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
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={handleCreate}
            disabled={joining || creating || !roomValue.trim()}
          >
            {creating ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Creating…
              </>
            ) : (
              <>
                <Plus />
                Create room
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

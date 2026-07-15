"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, MessageSquare, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormMode = "join" | "create";

interface JoinFormProps {
  roomValue: string;
  onRoomChange: (room: string) => void;
  onJoin: (username: string, room: string) => void;
  onCreateRoom: (room: string, createdBy: string) => void;
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
  const [mode, setMode] = useState<FormMode>("join");
  const [username, setUsername] = useState("");
  const [createRoomName, setCreateRoomName] = useState("");
  const [creatorName, setCreatorName] = useState("");

  useEffect(() => {
    if (errorCode === "room_not_found" && roomValue.trim()) {
      setMode("create");
      setCreateRoomName(roomValue.trim());
    }
  }, [errorCode, roomValue]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }
    setMode("join");
    const createdName = createRoomName.trim();
    if (createdName) {
      onRoomChange(createdName);
    }
    // Only react when a new success message arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [successMessage]);

  const switchToCreate = () => {
    onClearError();
    onClearSuccess();
    setCreateRoomName(roomValue.trim());
    setCreatorName(username.trim());
    setMode("create");
  };

  const switchToJoin = () => {
    onClearError();
    onClearSuccess();
    setMode("join");
  };

  const handleJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onJoin(username, roomValue);
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = createRoomName.trim();
    const creator = creatorName.trim();
    if (!name || !creator) {
      return;
    }
    onClearError();
    onClearSuccess();
    onCreateRoom(name, creator);
  };

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="space-y-3 text-center lg:text-left">
        <div className="flex items-center justify-center gap-3 lg:justify-start">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <MessageSquare className="size-6" aria-hidden />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Live Chat
          </h1>
        </div>

        <p className="text-sm text-muted-foreground">
          {mode === "join"
            ? "Pick an active room or enter a room name, then join with your display name."
            : "Enter your name and a unique room name to create a new chat room."}
        </p>
      </div>

      {mode === "join" ? (
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
              disabled={joining}
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
              disabled={joining}
              aria-invalid={Boolean(error)}
            />
          </div>

          {successMessage ? (
            <p
              role="status"
              className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-400"
            >
              {successMessage} You can join it now.
            </p>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="space-y-2 rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive"
            >
              <p>{error}</p>
              {errorCode === "room_not_found" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={switchToCreate}
                >
                  <Plus />
                  Create this room
                </Button>
              ) : null}
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={joining || !username.trim() || !roomValue.trim()}
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

          <div className="relative text-center">
            <span className="text-xs text-muted-foreground">
              Don&apos;t see your room?
            </span>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            size="lg"
            onClick={switchToCreate}
            disabled={joining}
          >
            <Plus />
            Create a new room
          </Button>
        </form>
      ) : (
        <form
          onSubmit={handleCreate}
          className="space-y-5 rounded-2xl border border-border bg-card/80 p-6 shadow-xl backdrop-blur"
          noValidate
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 w-fit"
            onClick={switchToJoin}
            disabled={creating}
          >
            <ArrowLeft />
            Back to join
          </Button>

          <div className="space-y-2">
            <Label htmlFor="creator-name">Your name</Label>
            <Input
              id="creator-name"
              name="creator-name"
              autoComplete="nickname"
              placeholder="e.g. alex"
              value={creatorName}
              onChange={(event) => {
                onClearError();
                setCreatorName(event.target.value);
              }}
              maxLength={50}
              required
              disabled={creating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-room">Room name</Label>
            <Input
              id="create-room"
              name="create-room"
              autoComplete="off"
              placeholder="e.g. product-team"
              value={createRoomName}
              onChange={(event) => {
                onClearError();
                onClearSuccess();
                setCreateRoomName(event.target.value);
              }}
              maxLength={100}
              required
              disabled={creating}
              aria-invalid={Boolean(error && mode === "create")}
            />
            <p className="text-xs text-muted-foreground">
              Room names are unique (case-insensitive). After creating, join
              with your username.
            </p>
          </div>

          {error && mode === "create" ? (
            <p
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
            disabled={creating || !createRoomName.trim() || !creatorName.trim()}
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
        </form>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

import { ChatLayout } from "@/components/chat/ChatLayout";
import { ConnectionBadge } from "@/components/chat/ConnectionBadge";
import { JoinForm } from "@/components/chat/JoinForm";
import { RoomList } from "@/components/chat/RoomList";
import { useChat } from "@/hooks/useChat";

export default function HomePage() {
  const {
    username,
    room,
    joined,
    messages,
    users,
    rooms,
    roomsLoading,
    typingUsers,
    status,
    joining,
    creating,
    error,
    errorCode,
    successMessage,
    clearError,
    clearSuccess,
    connectLobby,
    createRoom,
    join,
    leave,
    sendMessage,
    notifyTyping,
  } = useChat();

  const [selectedRoom, setSelectedRoom] = useState("");

  useEffect(() => {
    connectLobby();
  }, [connectLobby]);

  useEffect(() => {
    if (room) {
      setSelectedRoom(room);
    }
  }, [room]);

  if (!joined) {
    return (
      <div className="flex min-h-dvh flex-col bg-[radial-gradient(ellipse_at_top,_oklch(0.28_0.04_250)_0%,_var(--background)_55%)]">
        <header className="flex items-center justify-between border-b border-border/60 px-4 py-3 md:px-6">
          <p className="text-sm font-semibold tracking-tight">Live Chat</p>
          <ConnectionBadge status={status} />
        </header>
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 lg:flex-row lg:items-start lg:gap-10 lg:px-8">
          <div className="h-72 w-full overflow-hidden rounded-2xl border border-border bg-sidebar/90 shadow-xl lg:h-[28rem] lg:w-72 lg:shrink-0">
            <RoomList
              rooms={rooms}
              loading={roomsLoading}
              selectedRoom={selectedRoom}
              onSelect={setSelectedRoom}
              title="Active rooms"
            />
          </div>
          <div className="flex flex-1 justify-center lg:justify-start lg:pt-4">
            <JoinForm
              roomValue={selectedRoom}
              onRoomChange={setSelectedRoom}
              onJoin={join}
              onCreateRoom={createRoom}
              joining={joining}
              creating={creating}
              error={error}
              errorCode={errorCode}
              successMessage={successMessage}
              onClearError={clearError}
              onClearSuccess={clearSuccess}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChatLayout
      username={username}
      room={room}
      messages={messages}
      users={users}
      rooms={rooms}
      roomsLoading={roomsLoading}
      typingUsers={typingUsers}
      status={status}
      error={error}
      onClearError={clearError}
      onLeave={leave}
      onSend={sendMessage}
      onTyping={notifyTyping}
      onSelectRoom={setSelectedRoom}
    />
  );
}

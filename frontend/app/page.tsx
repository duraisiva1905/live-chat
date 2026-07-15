"use client";

import { ChatLayout } from "@/components/chat/ChatLayout";
import { JoinForm } from "@/components/chat/JoinForm";
import { useChat } from "@/hooks/useChat";

export default function HomePage() {
  const {
    username,
    room,
    joined,
    messages,
    users,
    status,
    joining,
    error,
    clearError,
    join,
    leave,
    sendMessage,
  } = useChat();

  if (!joined) {
    return (
      <JoinForm
        onJoin={join}
        joining={joining}
        error={error}
        onClearError={clearError}
      />
    );
  }

  return (
    <ChatLayout
      username={username}
      room={room}
      messages={messages}
      users={users}
      status={status}
      error={error}
      onClearError={clearError}
      onLeave={leave}
      onSend={sendMessage}
    />
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useSmartScroll(dependency: unknown) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distance < 80;
  }, []);

  useEffect(() => {
    if (!stickToBottom.current) {
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [dependency]);

  return { containerRef, bottomRef, handleScroll };
}

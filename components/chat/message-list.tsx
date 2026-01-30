"use client";

import * as React from "react";
import { observer } from "mobx-react-lite";
import { chatStore } from "@/lib/store/chat-store";
import { MessageItem } from "@/components/chat/message/message-item";
import { useEffect, useRef } from "react";

interface MessageListProps {
  onRegenerate?: (id: string, instructions?: string) => void;
  onEdit?: (id: string, newContent: string) => void;
  onBranch?: (id: string) => void;
}

export const MessageList = observer(({ onRegenerate, onEdit, onBranch }: MessageListProps) => {
  const messages = chatStore.thread;
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div className="flex flex-col w-full max-w-[48rem] mx-auto px-4">
      {messages.map((msg, index) => (
        <MessageItem 
            key={msg.id} 
            message={msg} 
            isStreaming={chatStore.isGenerating && index === messages.length - 1 && msg.role === "assistant"}
            onRegenerate={onRegenerate}
            onEdit={onEdit}
            onBranch={onBranch}
        />
      ))}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
});

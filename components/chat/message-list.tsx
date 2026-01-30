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
      {messages.map((msg, index) => {
        // Hide tool messages and system citation messages from the list
        if (msg.role === "tool") return null;
        // Keep system check for backward compatibility with older messages
        if (msg.role === "system" && msg.content.trim().startsWith('[')) return null;

        // Check for citations (New way: prop on assistant message)
        let citations = msg.citations;

        // Fallback: Check if this assistant message follows a search tool execution (Legacy way)
        if (!citations && msg.role === "assistant") {
            const prev = messages[index - 1];
            // Support both "tool" role (fresh) and "system" role (reloaded from DB)
            if (prev && (prev.role === "tool" || (prev.role === "system" && prev.content.trim().startsWith('[')))) {
                try {
                    const parsed = JSON.parse(prev.content);
                    if (Array.isArray(parsed)) {
                        citations = parsed;
                    }
                } catch (e) {
                    // Not citations, ignore
                }
            }
        }

        return (
            <MessageItem 
                key={msg.id} 
                message={msg} 
                isStreaming={chatStore.isGenerating && index === messages.length - 1 && msg.role === "assistant"}
                citations={citations}
                onRegenerate={onRegenerate}
                onEdit={onEdit}
                onBranch={onBranch}
            />
        );
      })}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
});

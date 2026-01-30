import * as React from "react";
import { ChatInput } from "@/components/chat/input/chat-input";

interface ChatWelcomeProps {
    onSend: (content: string, attachments: import("@/lib/store/chat-store").Attachment[]) => void;
}

export function ChatWelcome({ onSend }: ChatWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-semibold mb-8 text-neutral-900 dark:text-neutral-100">
            Ready when you are.
        </h1>

        {/* Centered Chat Input */}
        <div className="w-full max-w-[48rem] mb-8">
            <ChatInput 
                onSend={onSend} 
                className="p-0 bg-transparent" 
                showFooterDisclaimer={false} 
            />
        </div>
    </div>
  );
}

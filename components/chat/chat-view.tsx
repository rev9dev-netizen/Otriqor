/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import * as React from "react";
import { observer } from "mobx-react-lite";
import { modelRouter } from "@/lib/api/router";
import { chatStore } from "@/lib/store/chat-store";
import { createChat, createChatBranch, saveMessage, fetchMessages, updateChatTitle } from "@/lib/supabase/db";
import { ChatInput } from "@/components/chat/input/chat-input";
import { ChatWelcome } from "@/components/chat/chat-welcome";
import { MessageList } from "@/components/chat/message-list";
import { ModelSelector } from "@/components/chat/model-selector";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { CitationSidebar } from "@/components/chat/citation-sidebar";

interface ChatViewProps {
  chatId?: string;
}

export const ChatView = observer(({ chatId }: ChatViewProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const [model, setModel] = React.useState<"gpt-4o" | "mistral-large-latest">("mistral-large-latest");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isTemp, setIsTemp] = React.useState(false);
  const hasMessages = chatStore.thread.length > 0;

  // Sync Chat ID from URL/Prop
  React.useEffect(() => {
    if (chatId) {
        chatStore.setChatId(chatId);
    } else {
        // If no ID, we are in "New Chat" mode.
        chatStore.reset(); 
    }
  }, [chatId]);

  // Auto-turn off Temp Mode if Chat Store is reset (e.g. clicking New Chat sidebar button)
  React.useEffect(() => {
    if (!chatStore.chatId) {
        setIsTemp(false);
    }
  }, [chatStore.chatId]);

  // Load history from Supabase
  const loadHistory = async () => {
      if (chatId) {
          setIsLoading(true);
          try {
              const messages = await fetchMessages(chatId);
              
              chatStore.reset(); // Clear current
              chatStore.setChatId(chatId);
              
              if (messages && messages.length > 0) {
                 messages.forEach((msg: any) => {
                     // We should ideally preserve timestamps if possible, but basic add is fine for now
                     chatStore.addMessage(msg.role, msg.content, null, msg.id, msg.attachments, msg.citations);
                 });
              }
          } catch (e) {
              console.error("Failed to load history", e);
          } finally {
              setIsLoading(false);
          }
      }
  }

  React.useEffect(() => {
      if (chatId) {
          loadHistory();
      }
  }, [chatId]);

  // ... useEffects ...

  const handleSend = async (content: string, attachments: import("@/lib/store/chat-store").Attachment[]) => {
    console.log("ChatView.handleSend Received:", attachments);
    if (!user && !isTemp) {
        alert("Please log in to save your chat!");
    }
    
    // 1. Add User Message
    const userMsgId = chatStore.addMessage("user", content, null, null, attachments);
    
    // 2. Sync to DB (Only if NOT Temp)
    let currentChatId = chatStore.chatId;
    let isNewChat = false;

    try {
        if (!isTemp) {
            if (!currentChatId || currentChatId === chatId) { 
                if (!currentChatId) {
                    const newChat = await createChat("New Chat"); 
                    chatStore.setChatId(newChat.id);
                    currentChatId = newChat.id;
                    isNewChat = true;
                }
            }

            const userMsgNode = chatStore.messages.get(userMsgId);
            if (userMsgNode) {
                await saveMessage(currentChatId!, userMsgNode);
            }

            if (isNewChat) {
                window.history.pushState(null, '', `/c/${currentChatId}`); 
            }
        }

        // 3. Create Placeholder for Assistant Message
        const assistantMsgId = chatStore.addMessage("assistant", "");
        
        // 4. Stream Response
        try {
            if (attachments.length > 0) {
                chatStore.setIsAnalyzing(true);
                // Simulate analysis delay (1.5s per file, max 4s)
                const delay = Math.min(attachments.length * 1500, 4000);
                await new Promise(resolve => setTimeout(resolve, delay));
                chatStore.setIsAnalyzing(false);
            }

            chatStore.setIsGenerating(true);
            const stream = modelRouter.streamChat(model as any, chatStore.thread);
            let accumulatedContent = "";
            
            for await (const chunk of stream) {
                if (chunk.type === "text") {
                    accumulatedContent += chunk.content;
                    chatStore.updateMessageContent(assistantMsgId, accumulatedContent);
                } else if (chunk.type === "usage") {
                    chatStore.updateMessageStats(assistantMsgId, chunk.stats);
                } else if (chunk.type === "tool_result") {
                    // Refactored: Attach citations directly to Assistant Message
                    try {
                        const searchResults = JSON.parse(chunk.content);
                        if (Array.isArray(searchResults)) {
                            chatStore.updateMessageCitations(assistantMsgId, searchResults);
                        }
                    } catch (e) {
                         console.error("Failed to parse tool result for citations", e);
                    }
                }
            }
        } finally {
            chatStore.setIsGenerating(false);
            chatStore.setIsAnalyzing(false);
        }

        // 5. Save Assistant Message (Only if NOT Temp)
        if (!isTemp) {
            const assistantMsgNode = chatStore.messages.get(assistantMsgId);
            if (assistantMsgNode) {
                await saveMessage(currentChatId!, assistantMsgNode);

                // 6. Smart Title Gen (Fire and Forget)
                // Trigger if thread is short (e.g. first 2 turns) to rename "New Chat"
                if (chatStore.thread.length <= 6) { 
                    (async () => {
                        try {
                            const newTitle = await modelRouter.generateTitle(model as any, chatStore.thread);
                            if (newTitle && newTitle !== "New Chat") {
                                await updateChatTitle(currentChatId!, newTitle);
                            }
                        } catch (e) {
                            console.error("Title Auto-Gen Failed:", e);
                        }
                    })();
                }
            }
        }

    } catch (error) {
        console.error("Chat Failed:", error);
        if (error instanceof Error) {
             console.error("Error Message:", error.message);
             console.error("Error Stack:", error.stack);
        }
        console.log("Current User State:", user);
        chatStore.addMessage("system", `Error: Could not save to database. Details: ${(error as any)?.message || error}`);
    }
  };

  // 7. Regenerate / Edit Logic
  const handleRegenerate = async (msgId: string, instructions?: string) => {
    // For now simple in-place regeneration
    chatStore.updateMessageContent(msgId, ""); // Clear
    chatStore.setIsGenerating(true);
    // Note: We need to properly trigger the stream again from the previous context.
    // Ideally we find the sub-thread leading to this message.
    // Currently modelRouter.streamChat takes the WHOLE thread.
    // If we clear the last AI message, the thread is [User, User, ..., User, (Empty AI)].
    // It works perfectly for the last message.
    
    // If we want instructions (e.g. "Add detail"), we should probably append a temporary system user message?
    // For MVP, we just retry.
    try {
        const stream = modelRouter.streamChat(model as any, chatStore.thread);
        let accumulatedContent = "";
        for await (const chunk of stream) {
            if (chunk.type === "text") {
                accumulatedContent += chunk.content;
                chatStore.updateMessageContent(msgId, accumulatedContent);
            } else if (chunk.type === "usage") {
                chatStore.updateMessageStats(msgId, chunk.stats);
            }
        }
    } finally {
        chatStore.setIsGenerating(false);
    }
  };

  const handleEdit = async (msgId: string, newContent: string) => {
      chatStore.updateMessageContent(msgId, newContent);
  };

  const handleBranchChat = async (messageId: string) => {
    if (!chatId) return;
    
    try {
        const newChat = await createChatBranch(chatId, messageId, "Branch Chat");
        if (newChat) {
            toast.success("Chat branched!");
            // Force hard navigation to ensure full remount/reset
            window.location.assign(`/c/${newChat.id}`);
        }
    } catch (e) {
        console.error("Failed to branch chat", e);
        toast.error("Failed to create branch");
    }
  };

  return (
    <div className="flex h-full relative overflow-hidden">
        {/* Loading Overlay */}
        {isLoading && (
            <div className="absolute inset-0 z-50 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )}

        {/* Floating Controls Layer (Z-Index High) */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-40 pointer-events-none">
            {/* Top Left: Model Selector (Visible always, floating) */}
            <div className="pointer-events-auto">
                <ModelSelector currentModel={model as any} onModelChange={(m) => setModel(m as any)} />
            </div>

            {/* Top Right: Temp Chat Toggle (Visible ONLY on New Chat Page) */}
            {!hasMessages && !chatId && (
                <div className="pointer-events-auto">
                    <button 
                        onClick={() => setIsTemp(!isTemp)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                            isTemp 
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/50 hover:bg-amber-500/20" 
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-transparent hover:text-neutral-900 dark:hover:text-neutral-300"
                        )}
                    >
                        <Sparkles className={cn("h-3.5 w-3.5", isTemp && "fill-current")} />
                        <span>{isTemp ? "Temporary Chat Active" : "Ask Temporarily"}</span>
                    </button>
                    {isTemp && (
                        <p className="text-[10px] text-amber-500/80 text-right mt-1 mr-1">
                            Won&apos;t be saved in history.
                        </p>
                    )}
                </div>
            )}
        </div>

        {/* Main Content Area - Flexible Width */}
        <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300 ease-in-out">
            <div className="flex-1 w-full overflow-y-auto">
                {!hasMessages ? (
                    // Landing Empty State (Centered)
                    <ChatWelcome onSend={(content, attachments) => handleSend(content, attachments)} />
                ) : (
                    <div className="flex flex-col min-h-full">
                        {/* Messages Area - Pushes Footer down */}
                        <div className="flex-1 pt-14">
                            <MessageList onRegenerate={handleRegenerate} onEdit={handleEdit} />
                        </div>

                        {/* Sticky Footer Input */}
                        <div className="sticky bottom-0 z-30 w-full rounded-t-lg pb-2 bg-gradient-to-t from-white via-white to-transparent dark:from-[#121212] dark:via-[#121212] dark:to-transparent pt-10">
                            <ChatInput 
                                onSend={handleSend}
                                showFooterDisclaimer={true} // Visible in footer view
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Right Sidebar - Citations */}
        {chatStore.activeCitations && (
             <div className="w-[400px] shrink-0 h-full border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] transition-all duration-300 ease-in-out">
                  <CitationSidebar className="h-full" />
             </div>
        )}
    </div>
  );
});

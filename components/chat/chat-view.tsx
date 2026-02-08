/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import * as React from "react";
import { observer } from "mobx-react-lite";
// import { modelRouter } from "@/lib/api/router"; // Removed: Server side only
import { chatStore } from "@/lib/store/chat-store";
import { canvasStore } from "@/lib/store/canvas-store";
import { createChat, createChatBranch, saveMessage, fetchMessages, updateChatTitle } from "@/lib/supabase/db";
import { ChatInput } from "@/components/chat/input/chat-input";
import { ChatWelcome } from "@/components/chat/chat-welcome";
import { MessageList } from "@/components/chat/message-list";
import { ModelSelector } from "@/components/chat/model-selector";
import { SettingsDialog } from "@/components/profile/settings-dialog";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sparkles, Plus, MessageCircleDashed, SquarePen } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { CitationSidebar } from "@/components/chat/citation-sidebar";
import { CanvasPanel } from "@/components/canvas/canvas-panel";
import { toolActivityStore } from "@/lib/store/tool-activity-store";
import { sessionMCPStore } from "@/lib/store/session-mcp-store";
import { MCPEnablePrompt } from "@/components/chat/mcp-enable-prompt";
import { IntegrationsDialog } from "@/components/integrations/integrations-dialog";

interface ChatViewProps {
  chatId?: string;
}

export const ChatView = observer(({ chatId }: ChatViewProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const [model, setModel] = React.useState<"gpt-4o" | "mistral-large-latest">("mistral-large-latest");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isTemp, setIsTemp] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const hasMessages = chatStore.thread.length > 0;

  // Sync Chat ID from URL/Prop
  React.useEffect(() => {
    if (chatId) {
        chatStore.setChatId(chatId);
    } else {
        chatStore.reset();
        sessionMCPStore.resetSession(); // Reset MCP session on new chat
    }
  }, [chatId]);

  // Load User Preferences (Global)
  React.useEffect(() => {
    if (user) {
        chatStore.loadPreferences();
    }
  }, [user]);

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
                     // Pass parent_id to reconstruct tree
                     chatStore.addMessage(msg.role, msg.content, msg.parent_id, msg.id, msg.attachments, msg.citations);
                 });
              }
          } catch (e) {
              console.error("Failed to load history", e);
          } finally {
              setIsLoading(false);
          }
          
          // Sync Title
          import("@/lib/supabase/db").then(({ fetchChat }) => {
              fetchChat(chatId).then(chat => {
                  if (chat) chatStore.setTitle(chat.title);
              });
          });
      }
  }

  React.useEffect(() => {
      if (chatId) {
          loadHistory();
          // Load Canvas State
          canvasStore.loadState(chatId);
      } else {
          // New Chat -> Reset Canvas
          canvasStore.reset();
      }
  }, [chatId]);

  // Handle Updates to open status for autosave (if needing manual trigger? no, store handles it)

  // ... useEffects ...

  const handleSend = async (content: string, attachments: import("@/lib/store/chat-store").Attachment[], contextId?: string) => {
    if (!content.trim() && attachments.length === 0) return;
    
    if (!content.trim() && attachments.length === 0) return;
    
    // Clear previous tool activity/reasoning - No longer needed with message persistence
    // toolActivityStore.clearAll();

    console.log("ChatView.handleSend Received:", attachments, contextId);
    if (!user && !isTemp) {
        alert("Please log in to save your chat!");
    }

    // 0. Prepend Context to Content if Integration Selected
    let finalContent = content;
    if (contextId) {
        finalContent = `[System: Active Integration '${contextId}']\n${content}`;
    }
    
    // 1. Add User Message
    const userMsgId = chatStore.addMessage("user", finalContent, null, null, attachments);
    
    // 2. Sync to DB (Only if NOT Temp)
    let currentChatId = chatStore.chatId;
    let isNewChat = false;

    try {
        if (!isTemp) {
            if (!currentChatId || currentChatId === chatId) { 
                if (!currentChatId) {
                    const newChat = await createChat("New Chat"); 
                    chatStore.setChatId(newChat.id);
                    canvasStore.setChatId(newChat.id); // Sync Canvas
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
        
        // 4. Stream Response & Save
        await generateResponse(assistantMsgId, !isTemp && currentChatId ? currentChatId : undefined);

        // 5. Smart Title Gen (Fire and Forget)
        if (!isTemp && currentChatId && chatStore.thread.length <= 4) { 
             fetch("/api/chat/title", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ 
                     messages: chatStore.thread.map(m => ({ role: m.role, content: m.content })),
                     modelId: model 
                 })
             })
             .then(res => res.json())
             .then(data => {
                 if (data.title && currentChatId) {
                     updateChatTitle(currentChatId, data.title);
                     chatStore.setTitle(data.title); // Update UI immediately
                 }
             })
             .catch(err => console.error("Failed to auto-generate title", err));
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
    // Versioning: Create a sibling for the ASSISTANT message (AI retry)
    // If msgId is the assistant message, we branch from IT? No, we branch from its PARENT's other child.
    // Actually, createVersion(msgId, "") creates a sibling of msgId.
    
    // 1. Create new empty Assistant node as sibling of current one
    const newVersionId = chatStore.createVersion(msgId, "");
    
    if (newVersionId) {
        // 2. Stream into this new version
        await generateResponse(newVersionId, chatId);
    }
  };

  const handleEdit = async (msgId: string, newContent: string) => {
      // Versioning: Create a new sibling node with the new content
      const newNodeId = chatStore.createVersion(msgId, newContent);
      
      if (newNodeId) {
          // Save User Version to DB
          if (chatId) {
              const newNode = chatStore.messages.get(newNodeId);
              if (newNode) await saveMessage(chatId, newNode);
          }

          // Trigger AI response for this new branch
          // 1. Create Placeholder for Assistant Message (as child of new node)
          const assistantMsgId = chatStore.addMessage("assistant", "", newNodeId);
          
          // 2. Stream Response (Reuse logic?)
          // We need to call a "stream" function. Let's extract the stream logic or duplicate for now.
          // Ideally: handleGeneration(assistantMsgId)
          await generateResponse(assistantMsgId, chatId);
      }
  };

  // Stop Generation Logic
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleStop = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
      }
      chatStore.setIsGenerating(false);
      chatStore.setIsAnalyzing(false);
  };

  // Extract generation logic
  const generateResponse = async (assistantMsgId: string, saveToChatId?: string) => {
      try {
            chatStore.setIsGenerating(true);
            
            // Setup AbortController
            const ac = new AbortController();
            abortControllerRef.current = ac;
            
            let accumulatedContent = "";
            
            // Call Server API
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: chatStore.thread, // Send full thread
                    modelId: model,
                    chatId: saveToChatId
                }),
                signal: ac.signal
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                // Decode chunk and add to buffer
                buffer += decoder.decode(value, { stream: true });
                
                // Process complete lines (NDJSON)
                const lines = buffer.split("\n");
                // Keep the last partial line in buffer
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (!line.trim()) continue;
                    
                    try {
                        const chunk = JSON.parse(line);
                        
                        if (chunk.type === "text") {
                            accumulatedContent += chunk.content;
                            chatStore.updateMessageContent(assistantMsgId, accumulatedContent);
                        } else if (chunk.type === "usage") {
                            chatStore.updateMessageStats(assistantMsgId, chunk.stats);
                        } else if (chunk.type === "tool_result") {
                             try {
                                chatStore.updateMessageToolResults(assistantMsgId, {
                                    role: "tool",
                                    tool_call_id: chunk.tool_call_id,
                                    name: chunk.name,
                                    content: chunk.content
                                });
                                const searchResults = JSON.parse(chunk.content);
                                if (Array.isArray(searchResults)) {
                                    chatStore.updateMessageCitations(assistantMsgId, searchResults);
                                }
                            } catch (e) {
                                 // console.error("Failed to parse tool result for citations", e);
                            }
                        } else if (chunk.type === "tool_call") {
                            chatStore.updateMessageToolCalls(assistantMsgId, [chunk.tool_call]);
                        } else if (chunk.type === "tool_call_chunk") {
                            // Can ignore chunks if we handle final tool_call, or update incrementally
                            // Gateway currently sends chunks then maybe a final? 
                            // Actually gateway.ts logic yields 'tool_call_chunk'
                            // We need to accumulate them if we want real-time update
                            // For now, let's just log or ignore until full implementation
                        }
                    } catch (e) {
                        console.error("JSON Parse Error on line:", line, e);
                    }
                }
            }

            // Save Final AI Message to DB
            if (saveToChatId && accumulatedContent) {
                const finalMsg = chatStore.messages.get(assistantMsgId);
                if (finalMsg) {
                    await saveMessage(saveToChatId, finalMsg);
                }
            }

      } catch (error: any) {
           if (error.name === 'AbortError') {
               console.log("Generation Aborted");
           } else {
               console.error("Analysis Failed", error);
               chatStore.addMessage("system", `Error: ${error.message}`);
           }
      } finally {
            chatStore.setIsGenerating(false);
            chatStore.setIsAnalyzing(false);
            abortControllerRef.current = null;
      }
  };

  // ... (rest of code)

  return (
    <div className="flex h-full relative overflow-hidden">
        {/* ... (Loading Overlay & Floating Controls same as before) ... */}
        {isLoading && (
            <div className="absolute inset-0 z-50 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )}

        {/* Floating Controls Layer (Z-Index High) */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-40 pointer-events-none">
             {/* ... Model Selector ... */}
             <div className="pointer-events-auto flex items-center gap-2">
                <ModelSelector 
                    currentModel={model as any} 
                    onModelChange={(m) => setModel(m as any)} 
                    isTemp={isTemp}
                    onTempChange={setIsTemp}
                />
                <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
                <button
                    onClick={() => {
                        chatStore.reset();
                        router.push('/');
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100/50 dark:bg-neutral-800/50 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all border border-neutral-200/50 dark:border-neutral-700/50 text-neutral-600 dark:text-neutral-300"
                >
                    <SquarePen className="h-4 w-4" />
                    <span className="hidden sm:inline-block">New Chat</span>
                </button>
            </div>
             {/* ... Temp Toggle ... */}
             {/* ... Temp Toggle Moved to ModelSelector ... */}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300 ease-in-out">
            <div className="flex-1 w-full overflow-y-auto">
                {!hasMessages ? (
                    <ChatWelcome onSend={(content, attachments) => handleSend(content, attachments)} />
                ) : (
                    <div className="flex flex-col min-h-full">
                        <div className="flex-1 pt-14">
                            {sessionMCPStore.pendingEnableRequest && (
                                <div className="px-4 mb-4 max-w-3xl mx-auto">
                                    <MCPEnablePrompt
                                        integration={sessionMCPStore.pendingEnableRequest.integration}
                                        action={sessionMCPStore.pendingEnableRequest.action}
                                        onEnable={() => sessionMCPStore.respondToRequest(true)}
                                        onOpenSkillStore={() => {
                                            sessionMCPStore.dismissRequest();
                                            chatStore.setIsActiveIntegrationOpen(true);
                                        }}
                                    />
                                </div>
                            )}
                            
                            <MessageList onRegenerate={handleRegenerate} onEdit={handleEdit} />
                        </div>

                        {/* Sticky Footer Input */}
                        <div className="sticky bottom-0 z-30 w-full rounded-t-lg pb-2 bg-gradient-to-t from-white via-white to-transparent dark:from-[#121212] dark:via-[#121212] dark:to-transparent pt-10">
                            <ChatInput 
                                onSend={handleSend}
                                showFooterDisclaimer={true}
                                isGenerating={chatStore.isGenerating}
                                onStop={handleStop}
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

        {/* Canvas Panel */}
        {canvasStore.isOpen && <CanvasPanel />}
        
        <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        
        {/* Global Apps Dialog */}
        <IntegrationsDialog 
            open={chatStore.isActiveIntegrationOpen} 
            onOpenChange={(open) => chatStore.setIsActiveIntegrationOpen(open)}
            onSelect={(integration) => {
                 // Update Draft in Store
                 chatStore.setActiveIntegrationDraft({
                     id: integration.id,
                     label: integration.name,
                     icon: integration.icon
                 });
                 chatStore.setIsActiveIntegrationOpen(false);
            }}
            selectedIds={chatStore.activeIntegration ? [chatStore.activeIntegration.id] : []}
        />
    </div>
  );
});

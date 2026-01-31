import * as React from "react";
import { cn } from "@/lib/utils";
import { MessageNode, chatStore } from "@/lib/store/chat-store";
import { useState } from "react";
import { toast } from "sonner";
import { observer } from "mobx-react-lite";

// Sub-components
import { MessageActions } from "./message-actions";
import { MessageContent } from "./message-content";
import { FileText, Globe } from "lucide-react";
import { SearchResult } from "@/lib/tools/web-search";

interface MessageItemProps {
  message: MessageNode;
  isStreaming?: boolean;
  onRegenerate?: (id: string, instructions?: string) => void;
  onEdit?: (id: string, newContent: string) => void;
  onBranch?: (id: string) => void;
  citations?: SearchResult[];
}

export const MessageItem = observer(({ message, isStreaming, onRegenerate, onEdit, onBranch, citations }: MessageItemProps) => {
  const isUser = message.role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isCopied, setIsCopied] = useState(false);

  // Logic to determine if this message is currently being "analyzed"
  // We check global store state + ensure it's an assistant message + empty content + no stats yet
  const isAnalyzing = !isUser && chatStore.isAnalyzing && message.content === "" && !message.stats;
  const isSearching = !isUser && chatStore.isSearching && message.content === "" && !message.stats;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleEditSave = () => {
    if (onEdit && editContent.trim() !== message.content) {
        onEdit(message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleFeedback = (type: "like" | "dislike") => {
    if (message.feedback === type) {
        chatStore.setFeedback(message.id, null); // Toggle off
    } else {
        chatStore.setFeedback(message.id, type);
    }
  };

  return (
    <div className={cn(
        "group w-full flex min-w-0 mb-2", 
        isUser ? "flex-col justify-end items-end" : "flex-col justify-start items-start"
    )}>
        {/* Attachments - Separate Bubble Stack */}
        {/* Attachments - Customized Layout */}
        {message.attachments && message.attachments.length > 0 && (
            <div className={cn(
                "flex flex-wrap gap-2 max-w-[85%] mb-4", 
                isUser ? "justify-end" : "justify-start"
            )}>
                {message.attachments.map((file, i) => {
                    const isImage = file.type.startsWith("image/");
                    return (
                        <div key={i} className={cn(
                             "relative overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700",
                             isImage ? "aspect-auto max-w-sm" : "flex items-center gap-3 p-3 bg-neutral-100 dark:bg-neutral-800 min-w-[200px]"
                        )}>
                             {isImage ? (
                                <img 
                                    src={file.url || ((file.content || "").startsWith('data:') ? file.content : '')} 
                                    alt={file.name} 
                                    className="object-contain max-h-[300px] w-auto bg-neutral-100 dark:bg-neutral-900" 
                                />
                             ) : (
                                <>
                                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white dark:bg-neutral-900 text-neutral-500">
                                       <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm font-medium truncate text-neutral-900 dark:text-neutral-100">{file.name}</span>
                                        <span className="text-xs text-neutral-500 uppercase">{file.type.split('/')[1] || 'FILE'}</span>
                                    </div>
                                </>
                             )}
                        </div>
                    );
                })}
            </div>
        )}

        {/* Message Bubble (Text) - Only render if there is content or loading state */}
        {(message.content || isStreaming || isAnalyzing) && (
            <div className={cn(
                "rounded-3xl text-base transition-colors", 
                isUser 
                    ? "bg-[#f4f4f4] dark:bg-[#2f2f2f] text-gray-900 dark:text-gray-100 px-5 py-2.5 w-fit max-w-[85%]" 
                    : "bg-transparent text-gray-900 dark:text-gray-100 px-0 w-full" 
            )}>
                <div className="prose dark:prose-invert max-w-none prose-p:leading-7 prose-pre:my-2 prose-pre:bg-[#0d0d0d] prose-pre:rounded-xl">
                    <MessageContent 
                        isEditing={isEditing}
                        content={message.content}
                        editContent={editContent}
                        onEditChange={setEditContent}
                        onEditCancel={() => setIsEditing(false)}
                        onEditSave={handleEditSave}
                        isStreaming={isStreaming}
                        isAnalyzing={isAnalyzing}
                        isSearching={isSearching}
                        // Attachments handled in parent now
                    />
                </div>
                {/* <TokenStats stats={message.stats} /> */}
            </div>
        )}

        {/* Footer / Actions */}
        {!isStreaming && !isAnalyzing && !isEditing && (
             <div className="flex flex-col gap-2 items-start mt-1">
                 {/* Citations Button */}
                <div className="flex flex-col w-full gap-2">
                  <div className="flex items-center gap-2">
                      <MessageActions 
                          isUser={isUser}
                          message={message}
                          onEdit={() => setIsEditing(true)}
                          onCopy={handleCopy}
                          isCopied={isCopied}
                          onFeedback={handleFeedback}
                          onBranch={() => onBranch?.(message.id)}
                      />
                      {/* Citations Button - Now Inline */}
                      {citations && citations.length > 0 && (
                        <button 
                            onClick={() => {
                                // Toggle: If clicking same citations, close it. If different, open it.
                                if (chatStore.activeCitations === citations) {
                                    chatStore.setActiveCitations(null);
                                } else {
                                    chatStore.setActiveCitations(citations);
                                }
                            }}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium",
                                chatStore.activeCitations === citations 
                                    ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" 
                                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                            )}
                        >
                            <Globe className="w-3.5 h-3.5" />
                            <span className="ml-0.5">{citations.length} Sources</span>
                        </button>
                      )}
                  </div>
                  
                </div>
            </div>
        )}
    </div>
  );
});

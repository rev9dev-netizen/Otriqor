/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Mic, ArrowUp, X, Loader2, Square, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FeatureMenu } from "./feature-menu";
import { IntegrationsDialog } from "@/components/integrations/integrations-dialog";
import { Attachment } from "@/lib/store/chat-store";
import { useAuth } from "@/lib/hooks/use-auth";
import { observer } from "mobx-react-lite";
import { chatStore } from "@/lib/store/chat-store";

// Local extension of Attachment for UI state
interface InputAttachment extends Attachment {
    isUploading?: boolean;
}

interface ChatInputProps {
  onSend: (content: string, attachments: Attachment[], contextId?: string) => void;
  disabled?: boolean;
  className?: string;
  showFooterDisclaimer?: boolean;
  isGenerating?: boolean;
  onStop?: () => void;
}

export const ChatInput = observer(({ 
  onSend, 
  disabled,
  className,
  showFooterDisclaimer = true,
  isGenerating,
  onStop
}: ChatInputProps) => {
  const { user } = useAuth();
  const [input, setInput] = React.useState("");
  
  // Use Global Draft State
  const activeFeature = chatStore.activeIntegration;
  
  const [attachments, setAttachments] = React.useState<InputAttachment[]>([]);

  // Function to clear active integration
  const clearActiveIntegration = () => {
      chatStore.setActiveIntegrationDraft(null);
  };

  const [isMultiline, setIsMultiline] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ... (handleFileSelect, processFiles same as before)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
      // Create temp attachments immediately
      const tempAttachments: InputAttachment[] = [];
      const validFiles: File[] = [];

      for (const file of files) {
          if (attachments.length + tempAttachments.length >= 5) {
             alert("Max 5 files allowed");
             break;
          }
           if (file.size > 5 * 1024 * 1024) { 
                 alert(`File ${file.name} is too large (Max 5MB)`);
                 continue;
            }
          
          const tempId = Math.random().toString(36).substring(7);
          tempAttachments.push({
              id: tempId, // Temporary ID
              name: file.name,
              type: file.type,
              url: "", // Will be filled locally if image
              isUploading: true
          });
          validFiles.push(file);
      }

      if (tempAttachments.length === 0) return;

      // Optimistic update
      setAttachments(prev => [...prev, ...tempAttachments]);
      setIsUploading(true);

      try {
        await Promise.all(validFiles.map(async (file, index) => {
            const tempItem = tempAttachments[index];
            
            // 1. Local Preview Reading (for Images)
            let content = "";
            let url = "";

             if (file.type.startsWith("image/")) {
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(file);
                });
                url = base64;
                content = base64;
            }

            // Update purely local preview state first
             setAttachments(prev => prev.map(a => 
                a.id === tempItem.id ? { ...a, url: url } : a
             ));

            // 2. Upload
            const formData = new FormData();
            formData.append("file", file);

             let serverId = undefined;
             try {
                const res = await fetch("/api/files/upload", {
                    method: "POST",
                    body: formData
                });
                
                if (res.ok) {
                    const data = await res.json();
                    serverId = data.file.id;
                } else {
                    console.error("Upload failed");
                }
            } catch (e) {
                console.error("Upload error", e);
            }
            
            // Update final state for this item
             setAttachments(prev => prev.map(a => 
                a.id === tempItem.id ? {
                    ...a,
                    id: serverId || undefined, 
                    isUploading: false,
                    content: content
                } : a
             ));

        }));

      } finally {
        setIsUploading(false);
      }
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isUploading) return;
      if (isGenerating) {
          // If generating, Enter could stop? Or do nothing?
          // Usually do nothing or let user click stop.
          return;
      }
      if (!input.trim() && attachments.length === 0) return;
      
      onSend(input, attachments, activeFeature?.id);
      setInput("");
      setAttachments([]);
      chatStore.setActiveIntegrationDraft(null);
    }
  };
  
  // Feature menu activation for 'Upload' only (since Apps moved to Sidebar)
  const activateFeature = (id: string, label: string, icon: React.ReactNode) => {
      if (id === "upload") {
          fileInputRef.current?.click();
      }
  };

  return (
    <div className={cn("w-full max-w-[48rem] mx-auto px-4 px-4", className)}>
      <div className={cn(
           "relative z-10 w-full bg-[#f4f4f4] dark:bg-[#2f2f2f] border-transparent focus-within:border-neutral-300 dark:focus-within:border-neutral-600 rounded-3xl overflow-visible shadow-none transition-all duration-200 ease-in-out px-2 py-3",
           "grid gap-2",
           (attachments.length > 0 || isMultiline || !!activeFeature) ? "items-end" : "items-center",
           (attachments.length > 0 || isMultiline || !!activeFeature)
             ? "grid-cols-[auto_1fr]" 
             : "grid-cols-[auto_1fr_auto]" 
       )}>

        {/* Removed Integrations Toggle (moved to Sidebar) */}
        
        {/* area: attachments (Full Width) */}
        {attachments.length > 0 && (
             <div className="col-span-full row-start-1 w-full flex flex-wrap gap-2 pb-1 px-1">
                  {attachments.map((file, i) => {
                    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
                    return (
                        <div key={i} className="group relative flex items-center gap-3 p-2 pr-8 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 w-auto max-w-[240px]">
                        {file.isUploading ? (
                             <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-700">
                                 <Loader2 className="h-5 w-5 text-neutral-500 animate-spin" />
                             </div>
                        ) : file.type.startsWith("image/") ? (
                            <img src={file.url} alt={file.name} className="h-10 w-10 object-cover rounded-lg bg-white" />
                        ) : (
                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-[10px] font-bold">
                                {ext.slice(0, 4)}
                            </div>
                        )}
                        
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-medium truncate max-w-[150px] text-neutral-900 dark:text-neutral-100">{file.name}</span>
                            <span className="text-[10px] text-neutral-500 uppercase">
                                {file.isUploading ? "Uploading..." : (file.type.split('/')[1] || 'FILE')}
                            </span>
                        </div>

                        <button 
                            onClick={() => removeAttachment(i)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-500"
                        >
                            <X className="h-3 w-3" />
                        </button>
                        </div>
                    );
                  })}
             </div>
        )}

        {/* area: plus button */}
        <div className={cn(
             (attachments.length > 0 || isMultiline || !!activeFeature) 
                ? "col-start-1 row-start-3" 
                : "col-start-1" 
        )}>
             <FeatureMenu onActivateFeature={activateFeature} />
        </div>
        
        {/* Hidden File Input */}
        <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileSelect}
            accept="image/*,.pdf,.txt,.js,.ts,.tsx,.json,.md,.csv"
        />

        {/* area: text */}
        <div className={cn(
             "min-w-0 transition-all duration-200 flex flex-col justify-center",
             (attachments.length > 0 || isMultiline || !!activeFeature)
                ? "col-span-full w-full" 
                : "col-start-2 w-full" 
        )}>
            <TextareaAutosize
                ref={textareaRef}
                minRows={1}
                maxRows={12}
                onHeightChange={(height) => setIsMultiline(height > 40)}
                placeholder={activeFeature ? `${activeFeature.label}...` : "Ask Anything"}
                className={cn(
                    "w-full bg-transparent border-none outline-none resize-none text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 font-sans transition-all",
                    (attachments.length > 0 || isMultiline || !!activeFeature) ? "px-2" : "px-1"
                )}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGenerating} 
            />
        </div>

        {/* Active Feature Chip - Moved to Bottom Row */}
        {activeFeature && (
            <div className={cn(
                "flex items-center animate-in fade-in slide-in-from-bottom-1 duration-200 z-10",
                (attachments.length > 0 || isMultiline || !!activeFeature)
                    ? "col-start-2 row-start-3 justify-self-start self-center pl-1" 
                    : "hidden" 
            )}>
                <div className="flex items-center gap-1.5 pl-2 pr-3 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-xs font-medium text-neutral-700 dark:text-neutral-300 select-none">
                     {typeof activeFeature.icon === 'string' ? (
                        <img src={activeFeature.icon} alt={activeFeature.label} className="h-3 w-3 rounded-full object-cover" />
                     ) : (
                        activeFeature.icon
                     )}
                    <span>{activeFeature.label}</span>
                    <button 
                        onClick={clearActiveIntegration}
                        className="ml-1 p-0.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            </div>
        )}

        {/* area: actions (mic/send/stop) */}
        <div className={cn(
             "flex items-center gap-2 justify-end",
             (attachments.length > 0 || isMultiline || !!activeFeature)
                ? "col-start-2 row-start-3 pb-0.5" 
                : "col-start-3" 
        )}>
             {!input.trim() && !isGenerating && (
                <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 rounded-full">
                            <Mic className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Use voice</TooltipContent>
                </Tooltip>
                </TooltipProvider>
            )}

            {isGenerating ? (
                <Button 
                    size="icon" 
                    onClick={onStop}
                    className="h-8 w-8 rounded-full transition-all bg-primary text-primary-foreground hover:opacity-80"
                >
                    <Square className="h-3 w-3 fill-current" />
                </Button>
            ) : (
                <Button 
                    size="icon" 
                    disabled={(!input.trim() && attachments.length === 0) || disabled || isUploading}
                    onClick={() => {
                        if (isUploading) return;
                        if (!input.trim() && attachments.length === 0) return;
                        onSend(input, attachments, activeFeature?.id);
                        setInput("");
                        setAttachments([]);
                        chatStore.setActiveIntegrationDraft(null);
                    }}
                    className={cn(
                        "h-8 w-8 rounded-full transition-all", 
                        // Reliance on default variant (bg-primary) and disabled:opacity-50
                    )}
                >
                    <ArrowUp className="h-5 w-5" />
                </Button>
            )}
        </div>
      </div>
      
      {showFooterDisclaimer && (
          <div className="text-center mt-2.5">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">
                Zod.ai can make mistakes. Check important info.
            </p>
          </div>
      )}
    </div>
  );
});

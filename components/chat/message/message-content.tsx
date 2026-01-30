import * as React from "react";
import { Button } from "@/components/ui/button";
import TextareaAutosize from "react-textarea-autosize";
import { MarkdownRenderer } from "./markdown-renderer";
import { ThinkingAnimation } from "@/components/chat/thinking-animation";
// fileText removed

interface MessageContentProps {
  isEditing: boolean;
  content: string;
  editContent: string;
  onEditChange: (val: string) => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  // attachments removed
  
  isStreaming?: boolean;
  isAnalyzing?: boolean;
}

export function MessageContent({ 
    isEditing, 
    content, 
    editContent, 
    onEditChange, 
    onEditCancel, 
    onEditSave,
    isStreaming,
    isAnalyzing
}: MessageContentProps) {
    if (isEditing) {
        return (
            <div className="flex flex-col gap-2 min-w-[300px]">
                <TextareaAutosize 
                    value={editContent}
                    onChange={(e) => onEditChange(e.target.value)}
                    className="bg-transparent border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-neutral-500 w-full"
                    minRows={2}
                />
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={onEditCancel}>Cancel</Button>
                    <Button size="sm" onClick={onEditSave} className="bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200">Save</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2"> 
            
            {/* Content */}
            {(content.length > 0) && (
                <MarkdownRenderer content={content} />
            )}
            
            {/* Streaming / Analyzing Indicator - Sequential */}
            {(isStreaming || isAnalyzing) && content.length === 0 && (
                <div className="flex items-center gap-2 text-neutral-500">
                    {/* If Analyzing, show specific text. If just streaming (and not analyzed yet/anymore), show thinking. 
                        Actually, 'isAnalyzing' is true while RAG is happening. 'isStreaming' is true when Tokens are coming.
                        Usually RAG happens BEFORE tokens. 
                    */}
                    {isAnalyzing ? (
                         <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                            </span>
                            <span className="text-sm font-medium animate-pulse">Analyzing file...</span>
                         </div>
                    ) : (
                         <ThinkingAnimation />
                    )}
                </div>
            )}
        </div>
    );
}

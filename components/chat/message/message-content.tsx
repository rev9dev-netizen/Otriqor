import { Button } from "@/components/ui/button";
import TextareaAutosize from "react-textarea-autosize";
import { MarkdownRenderer } from "./markdown-renderer";
import { ThinkingAnimation } from "@/components/chat/thinking-animation";
import { observer } from "mobx-react-lite";
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
  isSearching?: boolean;
  hasReasoning?: boolean;
}

export const MessageContent = observer(function MessageContent({ 
    isEditing, 
    content, 
    editContent, 
    onEditChange, 
    onEditCancel, 
    onEditSave,
    isStreaming,
    isAnalyzing,
    isSearching,
    hasReasoning
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

    // Tool icon logic removed (legacy)

    // const currentTool = chatStore.currentToolExecution;

    return (
        <div className="flex flex-col gap-2"> 
            
            {/* Content */}
            {(content.length > 0) && (
                <MarkdownRenderer content={content} />
            )}
            
            {/* Streaming / Loading Indicator - Only if NOT reasoning */}
            {(isStreaming || isAnalyzing || isSearching) && !hasReasoning && content.length === 0 && (
                <div className="flex items-center gap-2 text-neutral-500">
                     <ThinkingAnimation />
                </div>
            )}
        </div>
    );
});

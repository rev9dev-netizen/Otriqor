"use client";

import * as React from "react";
import { observer } from "mobx-react-lite";
import { canvasStore } from "@/lib/store/canvas-store";
import { X, Copy, Check, FileCode, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import TextareaAutosize from "react-textarea-autosize"; // We likely have this as it was in settings

export const CanvasPanel = observer(() => {
    const [isCopied, setIsCopied] = React.useState(false);
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    if (!canvasStore.isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(canvasStore.content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className={cn(
            "flex flex-col h-full border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] transition-all duration-300 ease-in-out shadow-xl",
            isFullscreen ? "fixed inset-0 z-50 w-full" : "w-[45%] min-w-[400px]"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <FileCode className="h-4 w-4" />
                    </div>
                    <span>Canvas</span>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-500 font-normal uppercase tracking-wide">
                        {canvasStore.language}
                    </span>
                </div>
                
                <div className="flex items-center gap-1">
                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                        {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                     </Button>
                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsFullscreen(!isFullscreen)}>
                        {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                     </Button>
                     <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />
                     <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500/10 hover:text-red-500" onClick={() => canvasStore.setIsOpen(false)}>
                        <X className="h-3.5 w-3.5" />
                     </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto relative group">
                {/* We use a textarea for now to allow 'editing' - in a real app this might be Monaco Editor */}
                <textarea
                    value={canvasStore.content}
                    onChange={(e) => canvasStore.setContent(e.target.value)}
                    className="w-full h-full p-6 bg-transparent border-0 resize-none focus:ring-0 text-sm font-mono leading-relaxed text-neutral-800 dark:text-neutral-200 outline-none selection:bg-purple-500/20"
                    spellCheck={false}
                />
            </div>
            
            {/* Footer / Status Bar */}
            <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/30 text-[10px] text-neutral-400 flex justify-between items-center">
                <span>{canvasStore.content.length} chars</span>
                <span>Editable Mode</span>
            </div>
        </div>
    );
});

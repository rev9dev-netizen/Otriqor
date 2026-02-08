/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { canvasStore } from "@/lib/store/canvas-store";
import { Button } from "@/components/ui/button";
import { Copy, Pencil, ThumbsUp, ThumbsDown, Share, Check, MoreHorizontal, Volume2, GitFork, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface MessageActionsProps {
  isUser: boolean;
  message: any; 
  onEdit: () => void;
  onCopy: () => void;
  isCopied: boolean;
  onFeedback: (type: "like" | "dislike") => void;
  onBranch?: () => void;
  // Versioning Props
  currentVersion?: number;
  totalVersions?: number;
  onPrevVersion?: () => void;
  onNextVersion?: () => void;
}

export function MessageActions({ 
    isUser, message, onEdit, onCopy, isCopied, onFeedback, onBranch, 
    currentVersion, totalVersions, onPrevVersion, onNextVersion
}: MessageActionsProps) {
    const showLike = message.feedback === "like" || !message.feedback;
    const showDislike = message.feedback === "dislike" || !message.feedback;

    const hasVersions = (totalVersions || 0) > 1;

    // Navigation Component
    const versionNav = (
        <div className="flex items-center gap-1 mx-2 text-neutral-500 font-mono text-xs select-none">
            <button 
                onClick={onPrevVersion}
                disabled={currentVersion === 1}
                className="hover:text-neutral-300 disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors"
                aria-label="Previous version"
            >
                &lt;
            </button>
            <span>{currentVersion} / {totalVersions}</span>
            <button 
                onClick={onNextVersion}
                disabled={currentVersion === totalVersions}
                className="hover:text-neutral-300 disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors"
                aria-label="Next version"
            >
                &gt;
            </button>
        </div>
    );

    if (isUser) {
        return (
            <div className={cn(
                 "flex items-center gap-0.5 transition-opacity",
                 "justify-end opacity-0 group-hover:opacity-100" 
             )}>
                {hasVersions && versionNav}
                
                <Button onClick={onCopy} variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg">
                    {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                <Button onClick={onEdit} variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg">
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
            </div>
        );
    }

    return (
        <div className={cn(
             "flex items-center gap-0.5 transition-opacity",
             "justify-start opacity-100" 
         )}>
            {hasVersions && versionNav}

            <Button onClick={onCopy} variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg">
                 {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            
            {showLike && (
                <Button 
                    onClick={() => onFeedback("like")}
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                        "h-7 w-7 rounded-lg transition-colors",
                        message.feedback === "like" 
                            ? "text-white hover:text-white" 
                            : "text-neutral-400 hover:text-white hover:bg-white/10"
                    )}
                >
                    <ThumbsUp className={cn("h-3.5 w-3.5", message.feedback === "like" && "fill-current")} />
                </Button>
            )}
            
            {showDislike && (
                <Button 
                    onClick={() => onFeedback("dislike")}
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                        "h-7 w-7 rounded-lg transition-colors",
                        message.feedback === "dislike" 
                            ? "text-white hover:text-white" 
                            : "text-neutral-400 hover:text-white hover:bg-white/10"
                    )}
                >
                    <ThumbsDown className={cn("h-3.5 w-3.5", message.feedback === "dislike" && "fill-current")} />
                </Button>
            )}

            {/* Share Dialog */}
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg">
                        <Share className="h-3.5 w-3.5" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-[#1e1e1e] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Share Chat</DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Anyone with the link can view this chat.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <Input 
                                readOnly 
                                value={`https://zod.ai/share/${message.id.slice(0, 8)}`} 
                                className="bg-black/20 border-white/10 text-neutral-300 h-9 text-xs"
                            />
                        </div>
                        <Button size="sm" type="submit" className="px-3 h-9 bg-white text-black hover:bg-white/90"
                            onClick={() => {
                                navigator.clipboard.writeText(`https://zod.ai/share/${message.id.slice(0, 8)}`);
                                toast.success("Link copied!");
                            }}
                        >
                            <span className="sr-only">Copy</span>
                            <Copy className="h-4 w-4" />
                        </Button>
                        </div>
                </DialogContent>
            </Dialog>

            {/* More Options Menu (3-dots) */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-[#121212] border-white/10 text-white">
                    {/* 1. Date and Time */}
                    <div className="px-2 py-1.5 text-xs text-neutral-500 border-b border-white/5 mb-1">
                        {new Date(message.createdAt || 0).toLocaleString()}
                    </div>

                    {/* 2. Read Aloud */}
                    <DropdownMenuItem 
                        onClick={() => {
                            const utterance = new SpeechSynthesisUtterance(message.content);
                            window.speechSynthesis.speak(utterance);
                        }}
                        className="text-neutral-300 focus:text-white focus:bg-white/10 cursor-pointer"
                    >
                        <Volume2 className="mr-2 h-4 w-4" />
                        <span>Read Aloud</span>
                    </DropdownMenuItem>
                    


                    {/* 3. Branch Chat */}
                     <DropdownMenuItem 
                        onClick={() => onBranch?.()}
                        className="text-neutral-300 focus:text-white focus:bg-white/10 cursor-pointer"
                    >
                        <GitFork className="mr-2 h-4 w-4" />
                        <span>Branch from here</span>
                    </DropdownMenuItem>

                    {/* 4. Open in Canvas */}
                    <DropdownMenuItem 
                        onClick={() => canvasStore.openWithContent(message.content)}
                        className="text-neutral-300 focus:text-white focus:bg-white/10 cursor-pointer"
                    >
                        <FileCode className="mr-2 h-4 w-4" />
                        <span>Open in Canvas</span>
                    </DropdownMenuItem>

                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

"use client";

import * as React from "react";
import { X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchResult } from "@/lib/tools/web-search";
import { chatStore } from "@/lib/store/chat-store";
import { observer } from "mobx-react-lite";

interface CitationSidebarProps {
  className?: string; // Add className prop
}

export const CitationSidebar = observer(({ className }: CitationSidebarProps) => {
  const citations = chatStore.activeCitations;

  if (!citations) return null;

  return (
    <div className={cn(
        "flex flex-col h-full border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c]", // Use pure black or very dark grey
        className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span className="text-amber-500">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </span>
                Citations
            </h2>
            <p className="text-xs text-neutral-500 font-medium">References used to generate the response.</p>
        </div>
        <button 
            onClick={() => chatStore.setActiveCitations(null)}
            className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
            <X className="h-4 w-4 text-neutral-500" />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {citations.map((citation: SearchResult, index) => (
          <div 
            key={index} 
            className="group flex flex-col gap-2 p-4 rounded-xl bg-neutral-50 dark:bg-[#141414] border border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
               <div className="flex flex-col gap-0.5">
                   <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                        {citation.imageUrl && (
                            <img src={citation.imageUrl} alt="" className="w-3.5 h-3.5 object-contain opacity-70" />
                        )}
                        <span className="font-medium truncate max-w-[120px]">{citation.source || new URL(citation.link).hostname}</span>
                        <span>•</span>
                        <span className="uppercase tracking-wider text-[10px]">Source {index + 1}</span>
                   </div>
                   <a 
                      href={citation.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline leading-snug line-clamp-2"
                   >
                      {citation.title}
                   </a>
               </div>
               <a 
                  href={citation.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="shrink-0 p-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity"
               >
                   <ExternalLink className="h-3.5 w-3.5" />
               </a>
            </div>
            
            {citation.snippet && (
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3">
                    {citation.snippet}
                </p>
            )}
          </div>
        ))}

        <div className="pt-8 pb-4 text-center">
             <p className="text-xs text-neutral-400">
                AI can make mistakes. Please verify important information.
             </p>
        </div>
      </div>
    </div>
  );
});

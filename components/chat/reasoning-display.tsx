/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Sparkles, Search, Globe, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReasoningStep } from "@/lib/store/chat-store";
import { motion, AnimatePresence } from "framer-motion";
import { observer } from "mobx-react-lite";

interface ReasoningDisplayProps {
    steps: ReasoningStep[];
    connectedTo?: { name: string; icon: string };
    citations?: any[];
    isCollapsed?: boolean;
    onToggle?: () => void;
    className?: string;
}

export const ReasoningDisplay = observer(function ReasoningDisplay({
    connectedTo,
    steps,
    citations,
    isCollapsed = false,
    onToggle,
    className
}: ReasoningDisplayProps) {
    const [collapsed, setCollapsed] = useState(isCollapsed);

    useEffect(() => {
        setCollapsed(isCollapsed);
    }, [isCollapsed]);

    const handleToggle = () => {
        if (onToggle) onToggle();
        else setCollapsed(!collapsed);
    };

    const isThinking = steps.some(s => s.status === 'thinking');

    // Grouping Logic
    const searchSteps = steps.filter(s => s.toolName === 'web_search');
    const otherSteps = steps.filter(s => s.toolName !== 'web_search');

    const getHostname = (url: string) => {
        try {
            return new URL(url).hostname;
        } catch {
            return url || "Unknown source";
        }
    };

    return (
        <div className={cn("flex flex-col gap-2 font-sans select-none", className)}>
            {/* Header / Trigger - Shining Think */}
             <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={handleToggle}
                    className="flex items-center gap-2 text-sm font-medium transition-colors py-1 group"
                >
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
                        isThinking 
                            ? "bg-neutral-900/50 group-hover:bg-neutral-900 group-hover:border-neutral-700"
                            : "bg-green-500/10 border-green-500/20 group-hover:bg-green-500/20"
                    )}>
                        
                        <span className={cn(
                            "font-semibold tracking-wide",
                            isThinking 
                                ? "bg-gradient-to-r from-orange-300 via-amber-200 to-orange-400 bg-clip-text text-transparent animate-pulse"
                                : "text-green-600 dark:text-green-400"
                        )}>
                            {isThinking ? "Thinking" : "Research Complete"}
                        </span>
                        <span className="text-neutral-500 ml-1">
                            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </span>
                    </div>
                </button>

                {/* Connected Badge (if any) */}
                {connectedTo && collapsed && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-900/50 border border-neutral-800 text-xs text-neutral-400">
                         {connectedTo.icon && <img src={connectedTo.icon} alt="" className="h-3 w-3 rounded-sm opacity-70" />}
                         <span>{connectedTo.name}</span>
                    </div>
                )}
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {!collapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-4 pl-2 pt-2 pb-4 border-l border-neutral-800 ml-4">
                            
                            {/* 1. Searching Section (Robust) */}
                            {searchSteps.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500/50" />
                                        Searching..
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {searchSteps.map((step) => {
                                            const query = step.toolArgs?.q || step.toolArgs?.query || step.toolArgs?.query_term || "web";
                                            return (
                                                <div key={step.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-sm text-neutral-300">
                                                    <Search className="h-3.5 w-3.5 text-neutral-500" />
                                                    <span>{query}</span>
                                                    {step.status === 'thinking' && <Loader2 className="h-3 w-3 animate-spin text-neutral-600" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 2. Reviewing Sources Section */}
                            {citations && citations.length > 0 && (
                                <div className="flex flex-col gap-2 mt-2">
                                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500/50" />
                                        Analyzing Sources...
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {citations.map((cite, idx) => (
                                            <a 
                                                key={idx} 
                                                href={cite.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-900/30 border border-neutral-800/50 hover:bg-neutral-900 hover:border-neutral-700 transition-colors group/cite cursor-pointer text-decoration-none"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                                    {cite.icon ? (
                                                        <img src={cite.icon} alt="" className="h-4 w-4 rounded-sm shrink-0" />
                                                    ) : (
                                                        <Globe className="h-4 w-4 text-neutral-600 shrink-0" />
                                                    )}
                                                    <span className="text-sm font-medium text-neutral-300 truncate">{cite.title}</span>
                                                </div>
                                                <div className="flex items-center gap-2 pl-2 shrink-0">
                                                    <span className="text-xs text-neutral-500">
                                                        {(cite.source || getHostname(cite.url)).replace('www.', '')}
                                                    </span>
                                                    <ExternalLink className="h-3 w-3 text-neutral-600 opacity-0 group-hover/cite:opacity-100 transition-opacity" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 3. Other Steps (Standard) */}
                            {otherSteps.length > 0 && (
                                <div className="flex flex-col gap-2 mt-1">
                                    {otherSteps.map((step) => (
                                        <div key={step.id} className="flex items-center gap-3 text-sm text-neutral-400">
                                            {step.status === 'thinking' ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500" />
                                            ) : (
                                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                            )}
                                            <span className={cn(step.status === 'thinking' && "text-neutral-300")}>
                                                {step.thought}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Fallback if nothing to show but collapsed was opened toggled manually */}
                            {searchSteps.length === 0 && (!citations || citations.length === 0) && otherSteps.length === 0 && (
                                <div className="text-xs text-neutral-600 italic pl-1">
                                    Ready to think...
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

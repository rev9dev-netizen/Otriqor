/* eslint-disable react-hooks/purity */
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToolActivityEvent {
    id: string;
    toolName: string;
    status: "running" | "success" | "error";
    message?: string;
    startTime: number;
}

interface ToolActivityProps {
    events: ToolActivityEvent[];
    className?: string;
}

const TOOL_ICONS: Record<string, string> = {
    gmail: "📧",
    youtube: "📺",
    web_search: "🔍",
    weather: "🌤️",
    stock: "📈",
    time: "🕐",
    default: "🛠️"
};

function getToolIcon(toolName: string): string {
    const lower = toolName.toLowerCase();
    for (const [key, icon] of Object.entries(TOOL_ICONS)) {
        if (lower.includes(key)) return icon;
    }
    return TOOL_ICONS.default;
}

function formatToolName(name: string): string {
    return name
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .trim()
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
}

export function ToolActivity({ events, className }: ToolActivityProps) {
    if (events.length === 0) return null;

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <AnimatePresence mode="popLayout">
                {events.map((event) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-xl border backdrop-blur-sm",
                            event.status === "running" && "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
                            event.status === "success" && "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400",
                            event.status === "error" && "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                        )}
                    >
                        {/* Icon */}
                        <span className="text-lg">{getToolIcon(event.toolName)}</span>
                        
                        {/* Status Indicator */}
                        {event.status === "running" && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {event.status === "success" && (
                            <CheckCircle2 className="h-4 w-4" />
                        )}
                        {event.status === "error" && (
                            <XCircle className="h-4 w-4" />
                        )}

                        {/* Message */}
                        <span className="text-sm font-medium">
                            {event.status === "running" && `Using ${formatToolName(event.toolName)}...`}
                            {event.status === "success" && `${formatToolName(event.toolName)} complete`}
                            {event.status === "error" && `${formatToolName(event.toolName)} failed`}
                        </span>

                        {/* Duration for completed */}
                        {event.status !== "running" && (
                            <span className="text-xs opacity-60 ml-auto">
                                {((Date.now() - event.startTime) / 1000).toFixed(1)}s
                            </span>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

/**
 * Inline tool indicator for message bubbles
 */
export function ToolIndicator({ 
    toolName, 
    status 
}: { 
    toolName: string; 
    status: "running" | "success" | "error" 
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                status === "running" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                status === "success" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                status === "error" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            )}
        >
            {status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
            {status === "success" && <CheckCircle2 className="h-3 w-3" />}
            {status === "error" && <XCircle className="h-3 w-3" />}
            <span>{getToolIcon(toolName)} {formatToolName(toolName)}</span>
        </motion.div>
    );
}

/**
 * Tool timeline for multi-step reasoning
 */
export function ToolTimeline({ events }: { events: ToolActivityEvent[] }) {
    return (
        <div className="flex flex-col gap-1 py-2">
            {events.map((event, i) => (
                <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-2 text-sm"
                >
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        event.status === "running" && "bg-blue-500 animate-pulse",
                        event.status === "success" && "bg-green-500",
                        event.status === "error" && "bg-red-500"
                    )} />
                    <span className="text-muted-foreground">
                        {getToolIcon(event.toolName)} {formatToolName(event.toolName)}
                    </span>
                </motion.div>
            ))}
        </div>
    );
}

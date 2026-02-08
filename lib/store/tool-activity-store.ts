import { makeAutoObservable } from "mobx";
import type { ToolActivityEvent } from "@/components/chat/tool-activity";

export interface ReasoningStep {
    id: string;
    thought: string;
    status: "thinking" | "done";
    timestamp: number;
}

class ToolActivityStore {
    events: ToolActivityEvent[] = [];
    
    // Reasoning state
    reasoningSteps: ReasoningStep[] = [];
    currentIntegration: { name: string; icon: string } | undefined = undefined;
    
    constructor() {
        makeAutoObservable(this);
    }

    /**
     * Start a tool execution
     */
    startTool(toolName: string, label?: string): string {
        const id = `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();
        
        // Add to legacy events (for backward/other compat)
        const event: ToolActivityEvent = {
            id,
            toolName,
            status: "running",
            startTime
        };
        this.events.push(event);

        // Add to reasoning steps
        // Simple humanization if no label, though Executor usually provides one
        const fallback = `Using ${toolName.replace(/_/g, " ")}...`;
        const thought = label || fallback;
        
        this.reasoningSteps.push({
            id,
            thought,
            status: "thinking",
            timestamp: startTime
        });

        console.log(`[ToolActivityStore] Tool started: ${toolName}`);
        return id;
    }

    /**
     * Complete a tool execution
     */
    completeTool(id: string, success: boolean = true) {
        // Update legacy event
        const event = this.events.find(e => e.id === id);
        if (event) {
            event.status = success ? "success" : "error";
            // Auto-remove legacy event after 3 seconds
            setTimeout(() => {
                this.removeEvent(id);
            }, 3000);
        }

        // Update reasoning step
        const step = this.reasoningSteps.find(s => s.id === id);
        if (step) {
            step.status = "done";
            // No auto-removal for reasoning steps - let UI handle display/collapse
        }
    }

    /**
     * Set current integration being used (for "Connected to..." header)
     */
    setCurrentIntegration(info?: { name: string; icon: string }) {
        this.currentIntegration = info;
    }

    /**
     * Remove an event
     */
    removeEvent(id: string) {
        this.events = this.events.filter(e => e.id !== id);
    }

    /**
     * Clear all events and reasoning
     */
    clearAll() {
        this.events = [];
        this.reasoningSteps = [];
        this.currentIntegration = undefined;
    }

    /**
     * Get running events count
     */
    get runningCount(): number {
        return this.events.filter(e => e.status === "running").length;
    }
}

export const toolActivityStore = new ToolActivityStore();

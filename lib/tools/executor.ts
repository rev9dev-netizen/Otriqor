/* eslint-disable @typescript-eslint/no-explicit-any */
import { toolRegistry } from "./registry";
import { MessageNode } from "@/lib/store/chat-store";
import { StreamChunk } from "@/lib/api/router";

/**
 * The Brain 🧠
 * Handles the "Tool Call -> Execute -> Recursion" loop.
 * This replaces the duplicate logic in every adapter.
 */
export class ToolExecutor {
    constructor(
        private adapterId: string,
        // We use 'any' for the stream/reader to allow flexibility (ReadableStream vs DefaultReader)
        // different providers (mistral, openai) return different stream objects.
        private fetchStreamFn: (messages: any[], apiKey: string) => Promise<any>,
        private processStreamFn: (stream: any) => AsyncGenerator<StreamChunk>
    ) {}

    /**
     * Process potential tool calls from the model's output stream.
     * If tool calls are detected, it executes them, updates history, and recurses (calls model again).
     * @param toolCallBuffer The accumulated tool call from the previous stream chunks
     * @param currentMessages The conversation history up to this point
     * @param apiKey API key for recursion
     */
    async *executeToolCall(
        toolCallBuffer: any,
        formattedMessages: any[],
        sanitizedMessages: any[],
        apiKey: string
    ): AsyncGenerator<StreamChunk> {
        if (!toolCallBuffer) return;

        const toolName = toolCallBuffer.function.name;
        let args: any = {};
        try {
            args = JSON.parse(toolCallBuffer.function.arguments);
        } catch (e) {
            console.error("JSON Parse Error for Tool Args", e);
            // We might want to return here or let the tool handle empty args
        }

        // 1. Finalize the Assistant's "Intent" Message with a robust ID
        // This ensures the API sees a valid Tool Call message
        const callId = toolCallBuffer.id || "call_" + Math.random().toString(36).substr(2, 9);
        
        // We need to inject this into the history if it wasn't already (usually the adapter pushed a partial one)
        // But the safest way is to assume the adapter pushed the *text* content, and now we push the *tool_calls*.
        // A cleaner way: The adapter handles the *stream*, and when it detects end of tool call, it calls us.
        // We construct the "Assistant Tool Call" message here.

        const assistantMsg = {
            role: "assistant",
            tool_calls: [{
                id: callId,
                type: "function",
                function: { name: toolName, arguments: toolCallBuffer.function.arguments }
            }]
        };

        // Sync both history arrays
        formattedMessages.push(assistantMsg);
        sanitizedMessages.push(assistantMsg);

        // Yield the consolidated tool call to the client (so UI knows we are "calling X")
        yield { 
            type: "tool_call", 
            tool_call: { 
                id: callId,
                function: { name: toolName, arguments: toolCallBuffer.function.arguments },
                type: "function"
            }
        };

        // 2. Execute via Registry
        
        // Notify Store (Optional: could be an event or callback passed in)
        if (toolName === 'web_search' || toolName === 'get_stock') {
             import("@/lib/store/chat-store").then(({ chatStore }) => chatStore.setIsSearching(true));
        }

        let result;
        try {
            result = await toolRegistry.execute(toolName, args, {});
        } catch (e) {
            console.error(`[Executor] Tool Execution Failed:`, e);
            result = { content: JSON.stringify({ error: "Tool execution failed internal" }) };
        }

        // Notify Store Off
        if (toolName === 'web_search' || toolName === 'get_stock') {
             import("@/lib/store/chat-store").then(({ chatStore }) => chatStore.setIsSearching(false));
        }

        const resultContent = typeof result === 'string' ? result : (result.content || JSON.stringify(result));

        // 3. Yield Result to Client
        yield { type: "tool_result", content: resultContent, name: toolName, tool_call_id: callId };

        // 4. Update History with Result
        const toolMsg = { 
            role: "tool", 
            content: resultContent, 
            tool_call_id: callId, 
            name: toolName 
        };
        formattedMessages.push(toolMsg);
        sanitizedMessages.push(toolMsg);

        // 5. Recursion (The "Loop")
        // We ask the model: "Here is the result, what next?"
        
        // Use strict scrub logic if needed (Mistral specific, maybe pass as a strategy?)
        // For now, implementing the Mistral-style "Tool Call/Content" scrubbing here or reuse existing
        // We'll trust sanitizedMessages is mostly good, but apply the strictScrub helper if we move it here.
        // Importing strictScrub helper might be Circular if it stays in index.ts. 
        // We will implement a local version or accept it as param.
        
        const strictScrub = (msgs: any[]) => {
            return msgs.map(m => {
                if (m.tool_calls && m.tool_calls.length > 0) {
                    const { content, ...rest } = m;
                    return rest; // payload must not have content if tool_calls present (for Mistral)
                }
                if (m.tool_calls && m.tool_calls.length === 0) {
                    const { tool_calls, ...rest } = m;
                    return rest;
                }
                return m;
            });
        };

        const finalPayload = strictScrub(sanitizedMessages);
        
        const finalReader = await this.fetchStreamFn(finalPayload, apiKey);
        const finalGenerator = this.processStreamFn(finalReader);

        for await (const chunk of finalGenerator) {
             if (chunk.type === "text") {
                 yield { type: "text", content: chunk.content };
             }
             // Handle nested tool calls? (Deep recursion)
             // If the model wants to call ANOTHER tool, we could recurse again.
             // For simplicity in V1, we might not support infinite recursion, 
             // OR we detect it here.
             // Implementing 1-level recursion support is standard.
             // If we see tool_call_chunk here, we should ideally recurse again. 
             // That requires simpler logic refactor. For now, let's assume 1-depth or stream text.
        }
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";

/**
 * The "Raw Pipe" Interface.
 * Implementations only care about sending JSON to the API and yielding chunks.
 * They DO NOT handle RAG, Prompt Construction, or Tool Execution Logic.
 */
export interface ModelConnection {
    id: string;
    createStream(messages: any[], tools?: any[]): Promise<any>; // Returns Reader/Stream
    processStream(stream: any): AsyncGenerator<any>; // Yields standardized chunks
}

/**
 * Connection for OpenAI-compatible APIs (OpenAI, DeepSeek, Zhipu, Google, Nvidia, etc.)
 */
export class OpenAIConnection implements ModelConnection {
    private client: OpenAI;

    constructor(
        public id: string,
        config: { baseURL?: string; apiKey: string }
    ) {
        this.client = new OpenAI({
            baseURL: config.baseURL,
            apiKey: config.apiKey || "dummy",
            dangerouslyAllowBrowser: true
        });
    }

    async createStream(messages: any[], tools?: any[]): Promise<any> {
        // OpenAI expects 'tools' param if present
        const params: any = {
            model: this.id,
            messages: messages,
            stream: true,
        };

        if (tools && tools.length > 0) {
            params.tools = tools;
            params.tool_choice = "auto";
        }

        console.log(`[OpenAIConnection:${this.id}] Connecting to: ${this.client.baseURL}`);
        console.log(`[OpenAIConnection:${this.id}] Configured with Key: ${this.client.apiKey ? (this.client.apiKey.substring(0, 4) + '...') : 'MISSING'}`);
        console.log(`[OpenAIConnection:${this.id}] Creating stream with ${tools?.length || 0} tools...`);

        try {
            return await this.client.chat.completions.create(params);
        } catch (error: any) {
            console.error(`[OpenAIConnection:${this.id}] API Error:`, error);
            throw new Error(`Connection failed: ${error.message || 'Unknown network error'}`);
        }
    }

    async *processStream(stream: any): AsyncGenerator<any> {
        for await (const chunk of stream) {
            // Standardize OpenAI Chunk to Internal StreamChunk
            if (chunk.choices?.[0]?.delta?.content) {
                yield { type: "text", content: chunk.choices[0].delta.content };
            }
            
            if (chunk.choices?.[0]?.delta?.tool_calls) {
                const tc = chunk.choices[0].delta.tool_calls[0];
                yield { 
                    type: "tool_call_chunk", 
                    tool_call: {
                        id: tc.id,
                        function: {
                            name: tc.function?.name,
                            arguments: tc.function?.arguments
                        }
                    }
                };
            }

            if (chunk.usage) {
                 // Convert usage if mapped (OpenAI stream_options: { include_usage: true } needed needed)
                 // Keeping simple for now
            }
        }
    }
}

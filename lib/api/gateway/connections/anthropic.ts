/* eslint-disable @typescript-eslint/no-explicit-any */
import Anthropic from "@anthropic-ai/sdk";
import { ModelConnection } from "../connections";

export class AnthropicConnection implements ModelConnection {
    private client: Anthropic;

    constructor(
        public id: string,
        apiKey: string
    ) {
        this.client = new Anthropic({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true // Assuming client-side for now
        });
    }

    async createStream(messages: any[], tools?: any[]): Promise<any> {
         // Transform OpenAI-style messages to Anthropic style if needed
         // Messages from Gateway are already mostly compatible {role, content}
         // EXCEPT system prompt, which should be separate in Anthropic API
         
         const systemMsg = messages.find((m: any) => m.role === 'system');
         const conversation = messages.filter((m: any) => m.role !== 'system');
         
         const params: any = {
             model: this.id, // e.g. claude-3-5-sonnet-20240620
             max_tokens: 4096, // Default max
             messages: conversation,
             stream: true,
             system: systemMsg ? systemMsg.content : undefined
         };

         if (tools && tools.length > 0) {
             params.tools = tools.map((t: any) => ({
                 name: t.function.name,
                 description: t.function.description,
                 input_schema: t.function.parameters // Anthropic uses input_schema, OpenAI uses parameters
             }));
             // params.tool_choice = { type: "auto" }; // Default
         }

         console.log(`[AnthropicConnection:${this.id}] Initializing stream via Native SDK...`);
         try {
             return await this.client.messages.create(params);
         } catch (e: any) {
             console.error(`[AnthropicConnection] SDK Error:`, e);
             throw new Error(`Anthropic SDK Error: ${e.message}`);
         }
    }

    async *processStream(stream: any): AsyncGenerator<any> {
        // stream is an AsyncIterable from the SDK
        for await (const chunk of stream) {
            // Anthropic SDK Chunk Types
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                 yield { type: "text", content: chunk.delta.text };
            }
            
            if (chunk.type === "content_block_start" && chunk.content_block.type === "tool_use") {
                  // Wait, Anthropic sends tool_use in a block. 
                  // And args usually come in input_json_delta
                  // This complex handling might require state tracking if we strictly follow their streaming format
                  // Simplified: we yield tool_call_chunk with what we have
                  yield {
                      type: "tool_call_chunk",
                      tool_call: {
                          id: chunk.content_block.id,
                          function: {
                              name: chunk.content_block.name,
                              arguments: "" // Args come in subsequent deltas
                          }
                      }
                  };
            }

            if (chunk.type === "content_block_delta" && chunk.delta.type === "input_json_delta") {
                yield {
                    type: "tool_call_chunk",
                    tool_call: {
                        id: "unknown", // Context dependent, usually same as previous block
                        function: {
                            arguments: chunk.delta.partial_json
                        }
                    }
                };
            }
        }
    }
}

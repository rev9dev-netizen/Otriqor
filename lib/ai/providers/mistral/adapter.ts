/* eslint-disable @typescript-eslint/no-explicit-any */
import { Mistral } from '@mistralai/mistralai';
import { ModelConnection } from "../../types";

export class MistralAdapter implements ModelConnection {
    private client: Mistral;

    constructor(
        public id: string,
        apiKey: string
    ) {
        this.client = new Mistral({ apiKey: apiKey });
    }

    async createStream(messages: any[], tools?: any[]): Promise<any> {
         // Filter out empty messages that might cause 400 errors
         const validMessages = messages.filter(m => {
             const hasContent = typeof m.content === 'string' && m.content.trim().length > 0;
             const hasTools = Array.isArray(m.tool_calls) && m.tool_calls.length > 0;
             // Keep system/user messages even if empty? No, usually not helpful.
             // Assistant must have content or tool_calls.
             return hasContent || hasTools;
         });

         const params: any = {
             model: this.id,
             messages: validMessages,
             stream: true, 
         };

         if (tools && tools.length > 0) {
             params.tools = tools;
             params.toolChoice = "auto"; 
         }

         try {
             return await this.client.chat.stream(params);
         } catch (e: any) {
             console.error(`[MistralAdapter] SDK Error:`, e);
             throw new Error(`Mistral SDK Error: ${e.message}`);
         }
    }

    async *processStream(stream: any): AsyncGenerator<any> {
        for await (const chunk of stream) {
            const delta = chunk.data.choices[0].delta;
            
            if (delta.content !== undefined && delta.content !== null) {
                if (typeof delta.content === 'string') {
                    yield { type: "text", content: delta.content };
                } else if (Array.isArray(delta.content)) {
                     const text = delta.content.map((c: any) => c.type === 'text' ? c.text : '').join('');
                     if (text) yield { type: "text", content: text };
                }
            }

            if (delta.toolCalls) {
                const tc = delta.toolCalls[0];
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
        }
    }
}

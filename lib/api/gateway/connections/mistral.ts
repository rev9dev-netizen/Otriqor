/* eslint-disable @typescript-eslint/no-explicit-any */
import { Mistral } from '@mistralai/mistralai';
import { ModelConnection } from "../connections"; // Importing interface from existing file for now

export class MistralConnection implements ModelConnection {
    private client: Mistral;

    constructor(
        public id: string,
        apiKey: string
    ) {
        console.log(`[MistralConnection] Initializing with Key: ${apiKey ? (apiKey.substring(0, 4) + '...') : 'MISSING/EMPTY'}`);
        this.client = new Mistral({ apiKey: apiKey });
    }

    async createStream(messages: any[], tools?: any[]): Promise<any> {
         // Mistral SDK format
         const params: any = {
             model: this.id,
             messages: messages,
             stream: true, // We want a stream
         };

         if (tools && tools.length > 0) {
             params.tools = tools;
             params.toolChoice = "auto"; // SDK uses camelCase usually, check docs or assume standard
         }

         console.log(`[MistralConnection:${this.id}] Initializing stream via Native SDK...`);
         try {
             // wrapper for client.chat.stream
             const stream = await this.client.chat.stream(params);
             return stream;
         } catch (e: any) {
             console.error(`[MistralConnection] SDK Error:`, e);
             throw new Error(`Mistral SDK Error: ${e.message}`);
         }
    }

    async *processStream(stream: any): AsyncGenerator<any> {
        // stream is an AsyncIterable from the SDK
        for await (const chunk of stream) {
            const delta = chunk.data.choices[0].delta;
            
            // 1. Text Content
            if (delta.content !== undefined && delta.content !== null) {
                // Mistral SDK might return content as string or array
                if (typeof delta.content === 'string') {
                    yield { type: "text", content: delta.content };
                } else if (Array.isArray(delta.content)) {
                     // multi-modal or just text chunks?
                     const text = delta.content.map((c: any) => c.type === 'text' ? c.text : '').join('');
                     if (text) yield { type: "text", content: text };
                }
            }

            // 2. Tool Calls
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
            
            // 3. Usage (if available in last chunk)
            if (chunk.data.usage) {
                 // yield { type: "usage", ... }
            }
        }
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";
import { ModelConnection } from "../../types";

export class OpenAIAdapter implements ModelConnection {
    private client: OpenAI;

    constructor(
        public id: string,
        config: { baseURL?: string; apiKey: string }
    ) {
        this.client = new OpenAI({
            baseURL: config.baseURL,
            apiKey: config.apiKey,
            dangerouslyAllowBrowser: true
        });
    }

    async createStream(messages: any[], tools?: any[]): Promise<any> {
        const params: any = {
            model: this.id,
            messages: messages,
            stream: true,
        };

        if (tools && tools.length > 0) {
            params.tools = tools;
            params.tool_choice = "auto";
        }

        try {
            return await this.client.chat.completions.create(params);
        } catch (error: any) {
            console.error(`[OpenAIAdapter:${this.id}] API Error:`, error);
            throw new Error(`Connection failed: ${error.message || 'Unknown network error'}`);
        }
    }

    async *processStream(stream: any): AsyncGenerator<any> {
        for await (const chunk of stream) {
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
        }
    }
}

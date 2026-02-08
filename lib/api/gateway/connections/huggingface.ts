/* eslint-disable @typescript-eslint/no-explicit-any */
import { HfInference } from "@huggingface/inference";
import { ModelConnection } from "../connections";

export class HuggingFaceConnection implements ModelConnection {
    private client: HfInference;

    constructor(
        public id: string,
        apiKey: string
    ) {
        console.log(`[HuggingFaceConnection] Initializing with Key: ${apiKey ? (apiKey.substring(0, 4) + '...') : 'MISSING/EMPTY'}`);
        this.client = new HfInference(apiKey);
    }

    async createStream(messages: any[], tools?: any[]): Promise<any> {
         // Transform messages if necessary
         const params: any = {
             model: this.id,
             messages: messages,
             max_tokens: 2048, 
             stream: true,
         };

         // Note: HF Inference API tool support varies by model. 
         // Assuming basic chat completion for now. 
         // Qwen supports tools, but via specific prompts or API flags.
         // checking if tools are passed:
         if (tools && tools.length > 0) {
             console.warn(`[HuggingFaceConnection] Tools passed but HF implementation is basic. Model might not invoke them.`);
             // Pass them if the SDK allows, or just ignore/warn
             // params.tools = tools; 
         }

         console.log(`[HuggingFaceConnection:${this.id}] Initializing stream via Native SDK...`);
         try {
             return this.client.chatCompletionStream(params);
         } catch (e: any) {
             console.error(`[HuggingFaceConnection] SDK Error:`, e);
             throw new Error(`HF SDK Error: ${e.message}`);
         }
    }

    async *processStream(stream: any): AsyncGenerator<any> {
        // stream is an AsyncGenerator from the SDK
        for await (const chunk of stream) {
            // HF Chunk structure
            // HF Chunk structure
            // console.log("HF Chunk:", JSON.stringify(chunk)); // Debug
            if (chunk.choices && chunk.choices.length > 0 && chunk.choices[0]?.delta?.content) {
                 yield { type: "text", content: chunk.choices[0].delta.content };
            }
        }
    }
}

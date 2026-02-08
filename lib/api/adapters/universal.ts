/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";
import { MessageNode } from "@/lib/store/chat-store";
import { ModelAdapter } from "../router";
import { providers, models } from "@/lib/config/models";

export class UniversalAdapter implements ModelAdapter {
  private client: OpenAI;

  constructor(
    public id: string, 
    private config: { 
        baseURL?: string; 
        apiKeyEnv: string; 
    }
  ) {
    // Dynamic Key Loading
    const apiKey = process.env[config.apiKeyEnv] || process.env[`NEXT_PUBLIC_${config.apiKeyEnv}`] || "missing-key";
    
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: config.baseURL, 
      dangerouslyAllowBrowser: true
    });
  }

  async *streamChat(messages: MessageNode[], _userId?: string): AsyncGenerator<import("../router").StreamChunk, void, unknown> {
    try {
      // 1. Format messages
      const cleanMessages = messages.map(m => ({
        role: m.role as string, 
        content: m.content
      }));

      const formattedMessages: any[] = cleanMessages.map(m => {
        if (m.role === 'tool') {
             return { role: "tool", tool_call_id: "unknown", content: m.content };
        }
        return m;
      });

      // 2. Personalization Injection (Universal Logic)
      const { chatStore } = await import("@/lib/store/chat-store");

      const STYLE_MAP: Record<string, string> = {
          professional: "You are a LOGICAL and RIGOROUS assistant. Your reasoning must be precise. Avoid filler.",
          friendly: "You are a HELPFUL and PATIENT assistant. Explain concepts simply and warmly.",
          candid: "You are a DIRECT assistant. State facts plainly.",
          quirky: "You are a CREATIVE assistant. Think outside the box.",
      };

      let systemPrompt = "You are a helpful AI assistant.";
      // Try to find more specific description from config
      const modelDef = models.find(m => m.id === this.id);
      if (modelDef?.description) {
           // Maybe incorporate description? For now, stick to simple.
      }

      if (chatStore.baseStyle && chatStore.baseStyle !== 'default') {
           const styleInstruction = STYLE_MAP[chatStore.baseStyle] || `Style/Tone: ${chatStore.baseStyle}`;
           systemPrompt += `\n\n### PERSONA INSTRUCTION:\n${styleInstruction}`;
      }

      // Check for existing system message
      const hasSystem = formattedMessages.some(m => m.role === "system");
      if (!hasSystem) {
          formattedMessages.unshift({ role: "system", content: systemPrompt });
      } else {
         const sysMsg = formattedMessages.find(m => m.role === "system");
         if (sysMsg) sysMsg.content += "\n\n" + systemPrompt;
      }

      console.log(`[UniversalAdapter:${this.id}] Sending to API (${this.config.baseURL})...`);

      const stream = await this.client.chat.completions.create({
        model: this.id, 
        messages: formattedMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          yield { type: "text", content: chunk.choices[0].delta.content };
        }
      }

    } catch (error: any) {
      console.error(`Universal Adapter Error (${this.id}):`, error);
      yield { type: "text", content: `\n\n**Error (${this.id})**: ${error.message || "Unknown error"}` };
    }
  }
}

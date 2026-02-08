/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";
import { MessageNode } from "@/lib/store/chat-store";
import { ModelAdapter } from "../router";

export class DeepSeekAdapter implements ModelAdapter {
  private client: OpenAI;

  constructor(public id: string) {
    const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || "sk-7631c11084174a52adad9fbbd9ca7ffe";

    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.deepseek.com",
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

      // 2. Personalization Injection
      const { chatStore } = await import("@/lib/store/chat-store");

      const STYLE_MAP: Record<string, string> = {
          professional: "You are a LOGICAL and RIGOROUS assistant. Your reasoning must be precise. Avoid filler.",
          friendly: "You are a HELPFUL and PATIENT assistant. Explain concepts simply and warmly.",
          candid: "You are a DIRECT assistant. State facts plainly.",
          quirky: "You are a CREATIVE assistant. Think outside the box.",
      };

      let systemPrompt = "You are a helpful AI assistant powered by DeepSeek.";

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

      console.log("[DeepSeekAdapter] Sending to API:", formattedMessages);

      const stream = await this.client.chat.completions.create({
        model: this.id, // e.g. "deepseek-chat"
        messages: formattedMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          yield { type: "text", content: chunk.choices[0].delta.content };
        }
      }

    } catch (error: any) {
      console.error("DeepSeek Error:", error);
      yield { type: "text", content: `\n\n**DeepSeek Error**: ${error.message || "Unknown error"}` };
    }
  }
}

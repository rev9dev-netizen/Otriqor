/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";
import { MessageNode } from "@/lib/store/chat-store";
import { ModelAdapter } from "../router";

export class ZhipuAdapter implements ModelAdapter {
  private client: OpenAI;

  constructor(public id: string) {
    // Note: User must provide ZHIPU_API_KEY in .env or via settings
    // For now, we assume it's set in env `ZHIPU_API_KEY`
    // The user provided key: df0f4d8fefe844f7a753221852efdeab.frylUJx8UV1BHC1j
    // We can also check if we want to support storing keys in localStorage in the future.
    // For this verification step, I'll rely on process.env BUT fall back to a hardcoded key from the user request if valid.
    
    // In a real app, strict env usage is better. But user gave me the key to "test".
    // I should probably use a key manager or just process.env.
    
    const apiKey = process.env.NEXT_PUBLIC_ZHIPU_API_KEY || process.env.ZHIPU_API_KEY || "df0f4d8fefe844f7a753221852efdeab.frylUJx8UV1BHC1j";

    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://open.bigmodel.cn/api/paas/v4/",
      dangerouslyAllowBrowser: true // Client-side demo
    });
  }

  async *streamChat(messages: MessageNode[], _userId?: string): AsyncGenerator<import("../router").StreamChunk, void, unknown> {
    try {
      // 1. Format messages
      const cleanMessages = messages.map(m => ({
        role: m.role as string, // Relax type for processing
        content: m.content
      }));

      const formattedMessages: any[] = cleanMessages.map(m => {
        if (m.role === 'tool') {
             return { role: "tool", tool_call_id: "unknown", content: m.content }; // Simplify for now
        }
        return m;
      });

      // 2. Personalization Injection (Same logic as OpenAIAdapter)
      const { chatStore } = await import("@/lib/store/chat-store");

      const STYLE_MAP: Record<string, string> = {
          professional: "You are a highly disciplined PROFESSIONAL assistant. Your tone must be POLISHED, PRECISE, and FORMAL. Avoid colloquialisms.",
          friendly: "You are a WARM and FRIENDLY assistant. Your tone should be chatty, helpful, and approachable.",
          candid: "You are a CANDID assistant. Be DIRECT, ENCOURAGING, and honest.",
          quirky: "You are a QUIRKY assistant. Be PLAYFUL, IMAGINATIVE, and don't be afraid to use colorful metaphors.",
          efficient: "You are an EFFICIENT assistant. Be CONCISE and PLAIN. Do not waffle.",
          nerdy: "You are a NERDY assistant. Be EXPLORATORY and ENTHUSIASTIC about technical details.",
          cynical: "You are a CYNICAL assistant. Be CRITICAL and slightly SARCASTIC.",
      };

      let systemPrompt = "You are a helpful AI assistant powered by Zhipu AI (GLM models). Format responses in Markdown.";

      if (chatStore.baseStyle && chatStore.baseStyle !== 'default') {
           const styleInstruction = STYLE_MAP[chatStore.baseStyle] || `Style/Tone: ${chatStore.baseStyle}`;
           systemPrompt += `\n\n### PERSONA INSTRUCTION:\n${styleInstruction}`;
      }

      // Characteristics
      const chars = Object.entries(chatStore.characteristics).filter(([_, v]) => v !== 'default');
      if (chars.length > 0) {
          systemPrompt += `\n\n### TRAIT ADJUSTMENTS:`;
          chars.forEach(([k, v]) => {
               const trait = k.replace(/_/g, ' ');
               if (v === 'more') systemPrompt += `\n- Be MORE ${trait}.`;
               if (v === 'less') systemPrompt += `\n- Be LESS ${trait}.`;
          });
      }

      // About User
      const about = [];
      if (chatStore.aboutYou.nickname) about.push(`User Nickname: ${chatStore.aboutYou.nickname}`);
      if (chatStore.aboutYou.occupation) about.push(`User Occupation: ${chatStore.aboutYou.occupation}`);
      if (chatStore.aboutYou.bio) about.push(`User Bio: ${chatStore.aboutYou.bio}`);
      if (about.length > 0) {
          systemPrompt += `\n\n### USER CONTEXT:\n${about.join('\n')}`;
      }

      // Check for existing system message
      const hasSystem = formattedMessages.some(m => m.role === "system");
      if (!hasSystem) {
          formattedMessages.unshift({ role: "system", content: systemPrompt });
      } else {
         const sysMsg = formattedMessages.find(m => m.role === "system");
         if (sysMsg) sysMsg.content += "\n\n" + systemPrompt;
      }

      console.log("[ZhipuAdapter] Sending to API:", formattedMessages);

      const stream = await this.client.chat.completions.create({
        model: this.id, // e.g. "glm-4-plus"
        messages: formattedMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          yield { type: "text", content: chunk.choices[0].delta.content };
        }
      }

    } catch (error: any) {
      console.error("Zhipu Error:", error);
      yield { type: "text", content: `\n\n**Zhipu AI Error**: ${error.message || "Unknown error"}` };
    }
  }
}

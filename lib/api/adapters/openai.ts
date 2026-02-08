/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";
import { MessageNode } from "@/lib/store/chat-store";
import { ModelAdapter } from "../router";

export class OpenAIAdapter implements ModelAdapter {
  private client: OpenAI;

  constructor(public id: string, apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY || "dummy", // Fallback to avoid crash on init, but will fail call if missing
      dangerouslyAllowBrowser: true // For Phase 3 MVP (Client-side), later move to API Route (Phase 3.5)
    });
  }

  async *streamChat(messages: MessageNode[]): AsyncGenerator<import("../router").StreamChunk, void, unknown> {
    try {
      // Remove trailing assistant placeholder
      const cleanMessages = messages.filter((m, index) => {
         if (index === messages.length - 1 && m.role === 'assistant') return false;
         return true;
      });

      // Convert Linked List to Array
      const formattedMessages: any[] = cleanMessages.map(m => {
        // Basic text message
        if (!m.attachments || m.attachments.length === 0) {
            return {
                role: m.role as "user" | "assistant" | "system",
                content: m.content
            };
        }

        // Message with attachments (Universal Handling)
        const contentParts: any[] = [];
        
        // 1. Add Text Content
        if (m.content) {
            contentParts.push({ type: "text", text: m.content });
        }

        // 2. Process Attachments
        m.attachments.forEach(file => {
            if (file.type.startsWith("image/")) {
                // OpenAI Vision
                contentParts.push({
                    type: "image_url",
                    image_url: {
                        url: file.url, // Base64 or URL
                        detail: "auto"
                    }
                });
            } else {
                // Text Injection for other files (Universal Fallback)
                // We inject it as a text part: "File [Name]: \n [Content]"
                contentParts.push({
                    type: "text",
                    text: `\n\n[File Attachment: ${file.name}]\n\`\`\`\n${file.content}\n\`\`\`\n`
                });
            }
        });

        return {
            role: m.role,
            content: contentParts
        };
      });

      // Inject formatting and personalization instruction
      // Get personalization from store (client-side access)
      const { chatStore } = await import("@/lib/store/chat-store");
      
      const STYLE_MAP: Record<string, string> = {
          professional: "You are a highly disciplined PROFESSIONAL assistant. Your tone must be POLISHED, PRECISE, and FORMAL. Avoid colloquialisms. Structure your responses for maximum clarity.",
          friendly: "You are a WARM and FRIENDLY assistant. Your tone should be chatty, helpful, and approachable, like a kind colleague.",
          candid: "You are a CANDID assistant. Be DIRECT, ENCOURAGING, and honest. Don't sugarcoat, but be constructive.",
          quirky: "You are a QUIRKY assistant. Be PLAYFUL, IMAGINATIVE, and don't be afraid to use colorful metaphors or slight whimsy.",
          efficient: "You are an EFFICIENT assistant. Be CONCISE and PLAIN. Do not waffle. Get straight to the point.",
          nerdy: "You are a NERDY assistant. Be EXPLORATORY and ENTHUSIASTIC about technical details. Geek out where appropriate.",
          cynical: "You are a CYNICAL assistant. Be CRITICAL and slightly SARCASTIC. Question assumptions and don't be overly optimistic.",
      };

      let systemPrompt = "Format all responses using clean professional Markdown with clear section headers, bullet lists, and concise paragraphs. Use tables for comparisons and fenced code blocks for code.";
      
      // 1. Base Style (Strong Override)
      if (chatStore.baseStyle && chatStore.baseStyle !== 'default') {
           const styleInstruction = STYLE_MAP[chatStore.baseStyle] || `Style/Tone: ${chatStore.baseStyle}`;
           systemPrompt += `\n\n### PERSONA INSTRUCTION (CRITICALLY IMPORTANT):\n${styleInstruction}`;
      }
      
      // 2. Characteristics
      const chars = Object.entries(chatStore.characteristics)
        .filter(([_, v]) => v !== 'default');
      
      if (chars.length > 0) {
          systemPrompt += `\n\n### TRAIT ADJUSTMENTS:`;
          chars.forEach(([k, v]) => {
               const trait = k.replace(/_/g, ' ');
               if (v === 'more') systemPrompt += `\n- Be MORE ${trait}.`;
               if (v === 'less') systemPrompt += `\n- Be LESS ${trait}.`;
          });
      }
      
      // 3. About User
      const about = [];
      if (chatStore.aboutYou.nickname) about.push(`User Nickname: ${chatStore.aboutYou.nickname}`);
      if (chatStore.aboutYou.occupation) about.push(`User Occupation: ${chatStore.aboutYou.occupation}`);
      if (chatStore.aboutYou.bio) about.push(`User Bio: ${chatStore.aboutYou.bio}`);
      
      if (about.length > 0) {
          systemPrompt += `\n\n### USER CONTEXT:\n${about.join('\n')}`;
      }
      
      // 4. Custom Instructions
      if (chatStore.customInstructions) {
          systemPrompt += `\n\n### CUSTOM USER INSTRUCTIONS:\n${chatStore.customInstructions}`;
      }

      console.log("[OpenAIAdapter] Generated System Prompt:", systemPrompt);
      
      // 5. Advanced Flags
      const hasSystem = formattedMessages.some(m => m.role === "system");
      if (!hasSystem) {
          formattedMessages.unshift({ role: "system", content: systemPrompt });
      } else {
         const sysMsg = formattedMessages.find(m => m.role === "system");
         if (sysMsg && typeof sysMsg.content === 'string') {
             sysMsg.content += "\n\n" + systemPrompt;
         }
      }

      const startTime = Date.now(); // Start timing BEFORE request

      const stream = await this.client.chat.completions.create({
        model: this.id === "gpt-4o" ? "gpt-4o" : "gpt-3.5-turbo",
        messages: formattedMessages,
        stream: true,
        stream_options: { include_usage: true },
      });

      let firstTokenTime: number | null = null;


      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
            if (!firstTokenTime) {
                firstTokenTime = Date.now();
            }
            yield { type: "text", content };
        }

        if (chunk.usage) {
             const endTime = Date.now();
             const timeToFirstToken = firstTokenTime ? (firstTokenTime - startTime) / 1000 : 0;
             const totalDuration = (endTime - startTime) / 1000;
             const totalTokens = chunk.usage.total_tokens || 0;
             const tokensPerSec = totalDuration > 0 ? (totalTokens / totalDuration) : 0;

             yield {
                 type: "usage",
                 stats: {
                     tokensPerSec,
                     totalTokens,
                     timeToFirstToken,
                     stopReason: chunk.choices[0]?.finish_reason || "stop"
                 }
             };
        }
      }
    } catch (error) {
        console.error("OpenAI API Error:", error);
        yield { type: "text", content: "\n\n**Error**: Could not connect to OpenAI. Please check your API Key in settings or .env file." };
    }
  }
}

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

      // Inject formatting instruction
      const systemPrompt = "Format all responses using clean professional Markdown with clear section headers, bullet lists, and concise paragraphs. Use tables for comparisons and fenced code blocks for code.";
      
      const hasSystem = formattedMessages.some(m => m.role === "system");
      if (!hasSystem) {
          formattedMessages.unshift({ role: "system", content: systemPrompt });
      } else {
         // If system message exists, simpler to just append prompt to first system message
         // or just leave it. Let's append if it's string content.
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

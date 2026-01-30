import Anthropic from "@anthropic-ai/sdk";
import { MessageNode } from "@/lib/store/chat-store";
import { ModelAdapter } from "../router";

export class AnthropicAdapter implements ModelAdapter {
  private client: Anthropic;

  constructor(public id: string, apiKey?: string) {
    this.client = new Anthropic({
        apiKey: apiKey || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || "dummy",
        dangerouslyAllowBrowser: true 
    });
  }

  async *streamChat(messages: MessageNode[]): AsyncGenerator<string, void, unknown> {
    try {
      // Remove trailing assistant placeholder
      const cleanMessages = messages.filter((m, index) => {
         if (index === messages.length - 1 && m.role === 'assistant') return false;
         return true;
      });

      // Anthropic requires specific formatting (no system msg in messages array)
      const existingSystem = cleanMessages.find(m => m.role === "system")?.content;
      const formatInstruction = "Format all responses using clean professional Markdown with clear section headers, bullet lists, and concise paragraphs. Use tables for comparisons and fenced code blocks for code.";
      const systemMessage = existingSystem ? `${existingSystem}\n\n${formatInstruction}` : formatInstruction;

      const conversationMessages = cleanMessages
        .filter(m => m.role !== "system")
        .map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content
        }));

      const stream = await this.client.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1024,
        system: systemMessage,
        messages: conversationMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          yield chunk.delta.text;
        }
      }
    } catch (error) {
        console.error("Anthropic API Error:", error);
        yield "\n\n**Error**: Could not connect to Anthropic. Please check your API Key.";
    }
  }
}

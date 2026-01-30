/* eslint-disable @typescript-eslint/no-explicit-any */
import { Mistral } from "@mistralai/mistralai";
import { MessageNode } from "@/lib/store/chat-store";
import { ModelAdapter } from "../router";

export class MistralAdapter implements ModelAdapter {
  private client: Mistral;

  constructor(public id: string, apiKey?: string) {
    this.client = new Mistral({
      apiKey: apiKey || process.env.NEXT_PUBLIC_MISTRAL_API_KEY || "",
    });
  }

  async *streamChat(messages: MessageNode[]): AsyncGenerator<import("../router").StreamChunk, void, unknown> {
    try {
      // Filter out only the necessary messages (Chat Completion expects distinct turns)
      // We must exclude the trailing 'empty' assistant message that represents the current streaming response
      const cleanMessages = messages.filter((m, index) => {
         // If it's the last message AND it's an assistant (which is the placeholder), skip it
         if (index === messages.length - 1 && m.role === 'assistant') return false;
         return true;
      });

      // 1. Identify File Context
      const fileIds = new Set<string>();
      messages.forEach(m => {
          m.attachments?.forEach(a => {
              if (a.id) fileIds.add(a.id);
          });
      });

      // 2. Retrieve Relevant Context (RAG) - Only if files exist and there's a user query
      let ragContext = "";
      const lastUserMsg = messages[messages.length - 1]?.role === "user" 
          ? messages[messages.length - 1] 
          : messages[messages.length - 2]; // Handle if assistant placeholder is last

      if (fileIds.size > 0 && lastUserMsg && lastUserMsg.content) {
          const { retrieveContext } = await import("@/lib/rag/retriever");
          ragContext = await retrieveContext(lastUserMsg.content, Array.from(fileIds));
      }

      // 3. Format Messages
      const formattedMessages = cleanMessages.map(m => {
        let content = m.content;
        
        // Use RAG Context instead of raw injection if available
        // We still keep the "File Attachment" marker for UI consistency or reference
        if (m.attachments && m.attachments.length > 0) {
            m.attachments.forEach(file => {
               // Only inject text IF we didn't retrieve it via RAG (Fallback) 
               // OR maybe we just list the file name so model knows it exists.
               // For MVP, let's keep the raw injection for small files as fallback?
               // Actually, user wants RAG. 
               // Let's decide: If file has ID, we rely on RAG. If not (local/error), we rely on raw injection.
               if (!file.id) {
                   if (file.type.startsWith("image/")) {
                        content += `\n\n[Image Attachment: ${file.name}]`; 
                   } else {
                        content += `\n\n[File Attachment: ${file.name}]\n\`\`\`\n${file.content}\n\`\`\`\n`;
                   }
               } else {
                   content += `\n\n[Attached File: ${file.name}]`;
               }
            });
        }

        return {
            role: m.role as "user" | "assistant" | "system",
            content: content
        };
      });

      const systemPrompt = "You are a helpful, intelligent assistant. Be concise and direct. " + 
                           (ragContext ? "\n\nUse the following retrieved context to answer the user's question:\n" + ragContext : "");
      
      const hasSystem = formattedMessages.some(m => m.role === "system");
      if (!hasSystem) {
          formattedMessages.unshift({ role: "system", content: systemPrompt });
      } else {
          formattedMessages.at(0)!.content += "\n\n" + systemPrompt;
      }

      const startTime = Date.now(); // Start timing BEFORE request

      const stream = await this.client.chat.stream({
        model: this.id === "mistral-large-latest" ? "mistral-large-latest" : "codestral-latest", // Use Codestral for testing
        messages: formattedMessages,
      });

      let firstTokenTime: number | null = null;
      let totalContentLength = 0;

      for await (const chunk of stream) {
        const content = chunk.data.choices[0]?.delta?.content;
        if (typeof content === 'string') {
          if (!firstTokenTime) firstTokenTime = Date.now();
          totalContentLength += content.length;
          yield { type: "text", content };
        }
      }
      
      // Fallback usage report (Estimated)
      const endTime = Date.now();
      const timeToFirstToken = firstTokenTime ? (firstTokenTime - startTime) / 1000 : 0;
      const totalDuration = (endTime - startTime) / 1000;
      const estimatedTokens = Math.ceil(totalContentLength / 4);
      const tokensPerSec = totalDuration > 0 ? (estimatedTokens / totalDuration) : 0;

      yield {
          type: "usage",
          stats: {
              tokensPerSec,
              totalTokens: estimatedTokens,
              timeToFirstToken,
              stopReason: "stop"
          }
      };

    } catch (error) {
        console.error("Mistral API Error:", error);
        yield { type: "text", content: "\n\n**Error**: Could not connect to Mistral. Please check your API Key." };
    }
  }
  async generateTitle(messages: MessageNode[]): Promise<string> {
      try {
           const cleanMessages = messages.map(m => ({ role: m.role, content: m.content })).slice(0, 5); // Use first few messages context
           
           const titlePrompt = [
               { role: "system", content: "You are a helpful assistant." },
               ...cleanMessages.map(m => ({ role: m.role, content: m.content } as any)),
               { role: "user", content: "Summarize the above conversation into a simple, very short title (max 3-5 words). Avoid colon-based titles (e.g., 'Topic: Detail'). Just give the main topic directly." }
           ];

           const response = await this.client.chat.complete({
               model: "mistral-tiny", // Tiny model for speed/cost
               messages: titlePrompt as any,
           });

           const content = response.choices?.[0]?.message?.content;
           const title = (typeof content === 'string') ? content.trim() : "New Chat";
            
           // Cleanup quotes if AI adds them despite instructions
           return title.replace(/^["']|["']$/g, '');
      } catch (e) {
          console.error("Title Gen Error:", e);
          return "New Chat";
      }
  }
}

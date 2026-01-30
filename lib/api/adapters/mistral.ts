/* eslint-disable @typescript-eslint/no-explicit-any */
import { Mistral } from "@mistralai/mistralai";
import { MessageNode } from "@/lib/store/chat-store";
import { ModelAdapter } from "../router";
import { searchWeb } from "@/lib/tools/web-search";

export class MistralAdapter implements ModelAdapter {
  private client: Mistral;

  constructor(public id: string, apiKey?: string) {
    this.client = new Mistral({
      apiKey: apiKey || process.env.NEXT_PUBLIC_MISTRAL_API_KEY || "",
    });
  }

  async *streamChat(messages: MessageNode[]): AsyncGenerator<import("../router").StreamChunk, void, unknown> {
    const apiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY || "";
    
    try {
      // 1. Prepare Messages & Context (Same as before)
      const cleanMessages = messages.filter((m, index) => {
         if (index === messages.length - 1 && m.role === 'assistant') return false;
         return true;
      });

      const fileIds = new Set<string>();
      messages.forEach(m => m.attachments?.forEach(a => { if (a.id) fileIds.add(a.id); }));

      let ragContext = "";
      const lastUserMsg = messages[messages.length - 1]?.role === "user" 
          ? messages[messages.length - 1] 
          : messages[messages.length - 2];

      if (fileIds.size > 0 && lastUserMsg && lastUserMsg.content) {
          const { retrieveContext } = await import("@/lib/rag/retriever");
          ragContext = await retrieveContext(lastUserMsg.content, Array.from(fileIds));
      }

      // Format initial messages
      const formattedMessages: any[] = cleanMessages.map(m => {
        let content = m.content;
        if (m.attachments && m.attachments.length > 0) {
            m.attachments.forEach(file => {
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
            role: m.role as "user" | "assistant" | "system" | "tool",
            content: content,
            tool_call_id: (m as any).toolCallId || (m as any).tool_call_id, // Pass through if exists (for history)
            name: (m as any).name
        };
      });

      const systemPrompt = "You are a helpful, intelligent assistant. You have access to the internet via the 'web_search' tool. \n" +
                           "When you use the search tool and get results, you MUST cite your sources using providing a [Source Name](link) at the end of the sentence or paragraph.\n" + 
                           "Also, provide a 'Sources' section at the very end if multiple sources are used.\n" +
                           (ragContext ? "\n\nUse the following retrieved context to answer the user's question:\n" + ragContext : "");
      
      const hasSystem = formattedMessages.some(m => m.role === "system");
      if (!hasSystem) {
          formattedMessages.unshift({ role: "system", content: systemPrompt });
      } else {
          formattedMessages.at(0)!.content += "\n\n" + systemPrompt;
      }

      const tools = [
        {
            type: "function" as const,
            function: {
                name: "web_search",
                description: "Search the web for current information, news, or specific facts.",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "The search query to execute"
                        }
                    },
                    required: ["query"]
                }
            }
        }
      ];

      const startTime = Date.now();
      let firstTokenTime: number | null = null;
      let totalContentLength = 0;

      // --- HELPER: Raw Stream Fetcher ---
      const fetchStream = async (msgs: any[], toolsList?: any[]) => {
          const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                  model: this.id === "mistral-large-latest" ? "mistral-large-latest" : "codestral-latest",
                  messages: msgs,
                  tools: toolsList,
                  tool_choice: toolsList ? "auto" : undefined,
                  stream: true
              })
          });

          if (!response.ok) {
               const err = await response.text();
               throw new Error(`Mistral API Error ${response.status}: ${err}`);
          }
          
          if (!response.body) throw new Error("No response body");
          return response.body.getReader();
      };

      // --- FIRST PASS ---
      const reader = await fetchStream(formattedMessages, tools);
      const decoder = new TextDecoder();
      
      let toolCallBuffer: any = null;
      let isToolCall = false;
      let buffer = "";

      // Process Stream Helper
      // Returns true if tool call detected and complete, false if finished naturally
      const processStream = async function* (reader: ReadableStreamDefaultReader<Uint8Array>) {
          try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === "data: [DONE]") continue;
                    if (trimmed.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(trimmed.slice(6));
                            const delta = data.choices[0]?.delta;
                            
                            // 1. Tool Calls (snake_case from API)
                            if (delta?.tool_calls) {
                                isToolCall = true;
                                const tc = delta.tool_calls[0];
                                if (!toolCallBuffer) {
                                    toolCallBuffer = {
                                        id: tc.id,
                                        function: {
                                            name: tc.function?.name || "",
                                            arguments: tc.function?.arguments || ""
                                        }
                                    };
                                } else {
                                    toolCallBuffer.function.arguments += tc.function?.arguments || "";
                                }
                                continue;
                            }

                            // 2. Content
                            if (delta?.content) {
                                let text = "";
                                if (typeof delta.content === 'string') {
                                    text = delta.content;
                                } else if (Array.isArray(delta.content)) {
                                    // Handle array content (likely citations/references)
                                    // Just join text parts, ignore others for now
                                    text = delta.content
                                        .filter((c: any) => c.type === 'text')
                                        .map((c: any) => c.text)
                                        .join("");
                                }
                                
                                if (text) {
                                    if (!firstTokenTime) firstTokenTime = Date.now();
                                    totalContentLength += text.length;
                                    yield { type: "text", content: text };
                                }
                            }
                        } catch (e) {
                            console.error("Stream Parse Error:", e);
                        }
                    }
                }
            }
          } finally {
              reader.releaseLock();
          }
      };

      // Create generator and delegate
      // TypeScript requires explicit delegation or we can just loop
      // We loop to catch yield events
      const generator = processStream(reader);
      for await (const chunk of generator) {
          yield chunk as any;
      }

      // --- HANDLE TOOL EXECUTION ---
      if (isToolCall && toolCallBuffer) {
          yield { type: "text", content: "\n\n*Searching the web...*\n\n" }; // UI feedback

          let query = "";
          try {
             const args = JSON.parse(toolCallBuffer.function.arguments);
             query = args.query;
          } catch (e) {
             console.error("JSON Parse Error for Tool Args", e);
          }

          if (query) {
                console.log("Executing Web Search (Raw):", query);
                const searchResults = await searchWeb(query);
                const toolResultContent = JSON.stringify(searchResults);

                // 2. Append Assistant Message (snake_case for API)
                // Mistral requires NO Content if tool_calls present.
                const assistantMsg = {
                    role: "assistant",
                    tool_calls: [{
                        id: toolCallBuffer.id,
                        type: "function",
                        function: {
                            name: toolCallBuffer.function.name,
                            arguments: toolCallBuffer.function.arguments
                        }
                    }]
                };
                formattedMessages.push(assistantMsg);

                // 3. Append Tool Message
                formattedMessages.push({
                    role: "tool",
                    content: toolResultContent,
                    tool_call_id: toolCallBuffer.id,
                    name: "web_search"
                });

                // 4. SECOND PASS
                const finalReader = await fetchStream(formattedMessages, tools);
                const finalGenerator = processStream(finalReader);
                for await (const chunk of finalGenerator) {
                    yield chunk as any;
                }
          }
      }

      // Usage Stats
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
        console.error("Mistral Adapter Error:", error);
        yield { type: "text", content: `\n\n**Error**: ${(error as Error).message}` };
    }
  }

  async generateTitle(messages: MessageNode[]): Promise<string> {
      // (Keep existing generateTitle logic)
      try {
           const cleanMessages = messages.map(m => ({ role: m.role, content: m.content })).slice(0, 5);
           const titlePrompt = [
               { role: "system", content: "You are a helpful assistant." },
               ...cleanMessages.map(m => ({ role: m.role, content: m.content } as any)),
               { role: "user", content: "Summarize the above conversation into a simple, very short title (max 3-5 words). Avoid colon-based titles. Just give the main topic directly." }
           ];

           const response = await this.client.chat.complete({
               model: "mistral-tiny",
               messages: titlePrompt as any,
           });

           const content = response.choices?.[0]?.message?.content;
           const title = (typeof content === 'string') 
               ? content.trim().replace(/^["']|["']$/g, '') 
               : (Array.isArray(content) ? (content as any[]).map(c => c.text || "").join("") : "New Chat");
           return title;
      } catch (e) {
          console.error("Title Gen Error:", e);
          return "New Chat";
      }
  }
}

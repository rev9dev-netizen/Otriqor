/* eslint-disable @typescript-eslint/no-explicit-any */
import { Mistral } from "@mistralai/mistralai";
import { MessageNode } from "@/lib/store/chat-store";
import { ModelAdapter } from "../../router";
import { searchWeb } from "@/lib/tools/web-search";
import { tools } from "./tools";
import { constructSystemPrompt } from "./prompts";
import { fetchStream, processStream } from "./stream";

export class MistralAdapter implements ModelAdapter {
  private client: Mistral;

  constructor(public id: string, apiKey?: string) {
    this.client = new Mistral({
      apiKey: apiKey || process.env.NEXT_PUBLIC_MISTRAL_API_KEY || "",
    });
  }

  async *streamChat(messages: MessageNode[]): AsyncGenerator<import("../../router").StreamChunk, void, unknown> {
    const apiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY || "";
    
    try {
      // 1. Prepare Messages & Context
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
        const hasAttachments = m.attachments && m.attachments.length > 0;
        
        if (!hasAttachments) {
            return {
                role: m.role as "user" | "assistant" | "system" | "tool",
                content: m.content,
                tool_call_id: (m as any).toolCallId || (m as any).tool_call_id,
                name: (m as any).name
            };
        }

        // Construct content array
        const contentParts: any[] = [];
        
        // Add text part if exists
        if (m.content) {
            contentParts.push({ type: "text", text: m.content });
        }

        // Add attachments
        m.attachments?.forEach(file => {
             if (file.type.startsWith("image/")) {
                 contentParts.push({ 
                     type: "image_url", 
                     image_url: file.content 
                 });
             } else {
                 const fileText = `\n\n[File Attachment: ${file.name}]\n\`\`\`\n${file.content}\n\`\`\`\n`;
                 const lastPart = contentParts[contentParts.length - 1];
                 if (lastPart && lastPart.type === "text") {
                     lastPart.text += fileText;
                 } else {
                     contentParts.push({ type: "text", text: fileText });
                 }
             }
        });

        const payload: any = {
            role: m.role as "user" | "assistant" | "system" | "tool",
            tool_call_id: (m as any).toolCallId || (m as any).tool_call_id,
            name: (m as any).name,
        };

        if ((m as any).tool_calls && (m as any).tool_calls.length > 0) {
             payload.tool_calls = (m as any).tool_calls;
             // STRICT MISTRAL RULE: content must be absent or empty if tool_calls present (or check if API allows both?)
             // User error says: "Assistant message must have either content or tool_calls, but not both."
             // So we DELETE content if tool_calls are present.
             // But valid standard allows thought process. Mistral might not?
             // Or maybe content should be null?
             // Let's safe guard: If we have tool calls, we OMIT content.
             // If original message had content (thoughts), we might lose it?
             // Ideally we split into two messages: Assistant(Content) -> Assistant(ToolCall).
             // But for now, let's just prioritize tool call.
             // payload.content = contentParts; // LEAVE OUT
        } else {
             payload.content = contentParts;
        }

        return payload;
      });

      const systemPrompt = constructSystemPrompt(ragContext);
      
      const hasSystem = formattedMessages.some(m => m.role === "system");
      if (!hasSystem) {
          formattedMessages.unshift({ role: "system", content: systemPrompt });
      } else {
          formattedMessages.at(0)!.content += "\n\n" + systemPrompt;
      }

      const startTime = Date.now();
      let firstTokenTime: number | null = null;
      let totalContentLength = 0;

      // --- SANITIZE/FIX HISTORY ---
      // Fixes "Unexpected role 'tool' after role 'user'" by ensuring Assistant msg has tool_calls
      const sanitizedMessages: any[] = [];
      for (let i = 0; i < formattedMessages.length; i++) {
          const msg = formattedMessages[i];
          
          if (msg.role === "tool") {
              // Check previous message
              const prev = sanitizedMessages[sanitizedMessages.length - 1];
              
              if (prev && prev.role === "user") {
                  // ERROR STATE DETECTED: User -> Tool
                  // We must inject a fake Assistant message to satisfy API
                  // or if the previous was assistant but lost tool_calls, we fix it?
                  // The loop structure implies 'formattedMessages' matches original order.
                  // If we have User -> Tool, we are missing the Assistant who called it.
                  
                  // Heuristic: If we are just missing the assistant, inject one.
                  sanitizedMessages.push({
                      role: "assistant",
                      // content: null, // MISTRAL API ERRS ON THIS
                      tool_calls: [{
                          id: msg.tool_call_id || "call_" + Math.random().toString(36).substr(2, 9),
                          type: "function",
                          function: { name: msg.name || "unknown_tool", arguments: "{}" }
                      }]
                  });
              } else if (prev && prev.role === "assistant" && !prev.tool_calls) {
                   // Fix missing tool_calls on assistant
                   prev.tool_calls = [{
                       id: msg.tool_call_id || "call_fix_" + Math.random().toString(36).substr(2, 9),
                       type: "function",
                       function: { name: msg.name || "unknown_tool", arguments: "{}" }
                   }];
              }
          }
          sanitizedMessages.push(msg);
      }

      const reader = await fetchStream(sanitizedMessages, tools, apiKey, this.id);
      
      let toolCallBuffer: any = null;
      let isToolCall = false;

      // Delegate Generator
      const generator = processStream(reader);
      for await (const chunk of generator) {
          if (chunk.type === "tool_call_chunk") {
              isToolCall = true;
              const tc = chunk.tool_call;
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

          if (chunk.type === "text") {
             if (!firstTokenTime) firstTokenTime = Date.now();
             totalContentLength += (chunk.content as string).length;
             yield { type: "text", content: chunk.content as string };
          }
      }

      // --- HANDLE TOOL EXECUTION ---
      if (isToolCall && toolCallBuffer) {
           let args: any = {};
           try {
              args = JSON.parse(toolCallBuffer.function.arguments);
           } catch (e) {
              console.error("JSON Parse Error for Tool Args", e);
           }
           
           // Yield full tool call data to client store
           yield { type: "tool_call", tool_call: { 
               id: toolCallBuffer.id,
               function: { name: toolCallBuffer.function.name, arguments: toolCallBuffer.function.arguments },
               type: "function"
           }};

           const toolName = toolCallBuffer.function.name;

           if (toolName === "web_search" && args.query) {
                console.log("Executing Web Search (Raw):", args.query);
                import("@/lib/store/chat-store").then(({ chatStore }) => chatStore.setIsSearching(true));
                
                // 1. Push Assistant Message (Intent) FIRST to prevent orphaned tool messages if execution fails
                formattedMessages.push({
                    role: "assistant",
                    tool_calls: [{
                        id: toolCallBuffer.id,
                        type: "function",
                        function: { name: "web_search", arguments: toolCallBuffer.function.arguments }
                    }]
                });

                try {
                    const searchResults = await searchWeb(args.query);
                    const toolResultContent = JSON.stringify(searchResults);
    
                    yield { type: "tool_result", content: toolResultContent, name: "web_search" };
                    formattedMessages.push({ role: "tool", content: toolResultContent, tool_call_id: toolCallBuffer.id, name: "web_search" });
                    
                    // Yield tool_call so client stores it (Success path)
                    yield { type: "tool_call", tool_call: { 
                        id: toolCallBuffer.id,
                        function: { name: "web_search", arguments: toolCallBuffer.function.arguments },
                        type: "function"
                    }};
    
                    const finalReader = await fetchStream(formattedMessages, tools, apiKey, this.id);
                    const finalGenerator = processStream(finalReader);
                    import("@/lib/store/chat-store").then(({ chatStore }) => chatStore.setIsSearching(false));
                    
                    for await (const chunk of finalGenerator) {
                        if (chunk.type === "text") {
                            yield { type: "text", content: chunk.content as string };
                        }
                    }

                } catch (e) {
                     import("@/lib/store/chat-store").then(({ chatStore }) => chatStore.setIsSearching(false));
                     console.error("Tool Execution Error", e);
                     // Assistant message already pushed, so this tool error is now valid
                     formattedMessages.push({ role: "tool", content: JSON.stringify({ error: "Failed to search" }), tool_call_id: toolCallBuffer.id, name: "web_search" });
                     
                     // We should still yield the tool_call so client history is correct even on error
                     yield { type: "tool_call", tool_call: { 
                        id: toolCallBuffer.id,
                        function: { name: "web_search", arguments: toolCallBuffer.function.arguments },
                        type: "function"
                    }};

                     const finalReader = await fetchStream(formattedMessages, tools, apiKey, this.id);
                     const finalGenerator = processStream(finalReader);
                     for await (const chunk of finalGenerator) {
                         if (chunk.type === "text") yield { type: "text", content: chunk.content as string };
                     }
                }

           } else if (toolName === "get_stock" && args.query) {
               console.log("Executing Get Stock:", args.query);
               import("@/lib/store/chat-store").then(({ chatStore }) => chatStore.setIsSearching(true));

               // 1. Push Assistant Message (Intent) FIRST
               formattedMessages.push({
                    role: "assistant",
                    tool_calls: [{
                        id: toolCallBuffer.id,
                        type: "function",
                        function: { name: "get_stock", arguments: toolCallBuffer.function.arguments }
                    }]
               });

               try {
                   const stockData = await import("@/lib/stocks/stockTool").then(m => m.getStockData(args.query));
                   const toolResultContent = JSON.stringify(stockData);

                   yield { type: "tool_result", content: toolResultContent, name: "get_stock" };
                   formattedMessages.push({ role: "tool", content: toolResultContent, tool_call_id: toolCallBuffer.id, name: "get_stock" });
                   
                    // Yield tool_call so client stores it
                    yield { type: "tool_call", tool_call: { 
                        id: toolCallBuffer.id,
                        function: { name: "get_stock", arguments: toolCallBuffer.function.arguments },
                        type: "function"
                    }};

                   const finalReader = await fetchStream(formattedMessages, tools, apiKey, this.id);
                   const finalGenerator = processStream(finalReader);
                   import("@/lib/store/chat-store").then(({ chatStore }) => chatStore.setIsSearching(false));
                   
                   for await (const chunk of finalGenerator) {
                       if (chunk.type === "text") {
                           yield { type: "text", content: chunk.content as string };
                       }
                   }

               } catch (e) {
                    import("@/lib/store/chat-store").then(({ chatStore }) => chatStore.setIsSearching(false));
                    console.error("Stock Tool Error", e);
                    
                    // Assistant message already pushed, safe to add tool error
                    formattedMessages.push({ role: "tool", content: JSON.stringify({ error: "Stock data not available" }), tool_call_id: toolCallBuffer.id, name: "get_stock" });
                    
                    // Still yield tool call for client history
                    yield { type: "tool_call", tool_call: { 
                        id: toolCallBuffer.id,
                        function: { name: "get_stock", arguments: toolCallBuffer.function.arguments },
                        type: "function"
                    }};

                    const finalReader = await fetchStream(formattedMessages, tools, apiKey, this.id);
                    const finalGenerator = processStream(finalReader);
                    for await (const chunk of finalGenerator) {
                        if (chunk.type === "text") {
                            yield { type: "text", content: chunk.content as string };
                        }
                    }
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
        const msg = (error as Error).message.replace(/^Mistral Error \d+: /, "");
        yield { type: "text", content: `\n\n**Error**: ${msg}` };
    }
  }

  async generateTitle(messages: MessageNode[]): Promise<string> {
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

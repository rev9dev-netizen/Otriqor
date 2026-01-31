/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Mistral } from "@mistralai/mistralai";
import { MessageNode } from "@/lib/store/chat-store";
import { ModelAdapter } from "../../router";
import { constructSystemPrompt } from "./prompts";
import { fetchStream, processStream } from "./stream";
import { toolRegistry } from "@/lib/tools";
import { ToolExecutor } from "@/lib/tools/executor";
import { chatStore } from "@/lib/store/chat-store";

export class MistralAdapter implements ModelAdapter {
  private client: Mistral;
  private executor: ToolExecutor;

  constructor(public id: string, apiKey?: string) {
    this.client = new Mistral({
      apiKey: apiKey || process.env.NEXT_PUBLIC_MISTRAL_API_KEY || "",
    });
    // Initialize Executor with bound stream function to pass tools and id correctly
    this.executor = new ToolExecutor(id, 
        (msgs, key) => fetchStream(msgs, toolRegistry.getDefinitions(), key, id), 
        processStream
    );
  }

  async *streamChat(messages: MessageNode[]): AsyncGenerator<import("../../router").StreamChunk, void, unknown> {
    const apiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY || "";
    
    try {
      // 1. Prepare Messages & Context (RAG)
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
      // Format initial messages and EXPAND tool/result/answer triples
      const formattedMessages: any[] = [];
      
      cleanMessages.forEach(m => {
        const hasAttachments = m.attachments && m.attachments.length > 0;
        const hasToolCalls = (m as any).tool_calls && (m as any).tool_calls.length > 0;
        const hasToolResults = (m as any).tool_results && (m as any).tool_results.length > 0;

        // 1. Standard Text/Attachment Message
        if (!hasToolCalls) {
             const contentParts: any[] = [];
             if (m.content) contentParts.push({ type: "text", text: m.content });
             
             m.attachments?.forEach(file => {
                 if (file.type.startsWith("image/")) {
                     contentParts.push({ type: "image_url", image_url: file.content });
                 } else {
                     const fileText = `\n\n[File Attachment: ${file.name}]\n\`\`\`\n${file.content}\n\`\`\`\n`;
                     contentParts.push({ type: "text", text: fileText });
                 }
             });

             formattedMessages.push({
                 role: m.role as "user" | "assistant" | "system" | "tool",
                 content: (contentParts.length === 1 && contentParts[0].type === "text") ? contentParts[0].text : (contentParts.length > 0 ? contentParts : ""),
                 tool_call_id: (m as any).toolCallId || (m as any).tool_call_id,
                 name: (m as any).name
             });
             return;
        }

        // 2. Complex Agentic Message (Assistant with Tools)
        // EXPANSION: Assistant(Call) -> Tool(Result) -> Assistant(Answer)
        
        // A. The Call
        formattedMessages.push({
            role: "assistant",
            tool_calls: (m as any).tool_calls
        });

        // B. The Results
        if (hasToolResults) {
            (m as any).tool_results.forEach((res: any) => {
                formattedMessages.push({
                    role: "tool",
                    content: res.content,
                    tool_call_id: res.tool_call_id,
                    name: res.name
                });
            });
        }

        // C. The Final Answer (if exists)
        if (m.content) {
            formattedMessages.push({
                role: "assistant",
                content: m.content
            });
        }
      });

      const systemPrompt = constructSystemPrompt(ragContext, chatStore.personality);
      const hasSystem = formattedMessages.some(m => m.role === "system");
      if (!hasSystem) {
          formattedMessages.unshift({ role: "system", content: systemPrompt });
      } else {
          formattedMessages.at(0)!.content += "\n\n" + systemPrompt;
      }

      // --- SANITIZE/FIX HISTORY (Mistral Rules) ---
      const sanitizedMessages: any[] = [];
      for (let i = 0; i < formattedMessages.length; i++) {
          const msg = formattedMessages[i];
          
          // Self-Healing: Check for Orphaned Tool Calls (Assistant with calls but no Tool message following)
          const prev = sanitizedMessages[sanitizedMessages.length - 1];
          if (prev && prev.role === 'assistant' && prev.tool_calls && prev.tool_calls.length > 0) {
              if (msg.role !== 'tool') {
                   // Found orphan! Downgrade to text or drop.
                   if (prev.content) {
                       delete prev.tool_calls; // Keep text, remove calls
                   } else {
                       sanitizedMessages.pop(); // Remove empty assistant message completely
                   }
              }
          }

          if (msg.role === "tool") {
              const prev = sanitizedMessages[sanitizedMessages.length - 1];
              if (prev && prev.role === "user") {
                  sanitizedMessages.push({
                      role: "assistant",
                      tool_calls: [{
                          id: msg.tool_call_id || "call_" + Math.random().toString(36).substr(2, 9),
                          type: "function",
                          function: { name: msg.name || "unknown", arguments: "{}" }
                      }]
                  });
              } else if (prev && prev.role === "assistant" && !prev.tool_calls) {
                   const generatedId = msg.tool_call_id || "call_fix_" + Math.random().toString(36).substr(2, 9);
                   delete prev.content; 
                   prev.tool_calls = [{
                       id: generatedId,
                       type: "function",
                       function: { name: msg.name || "unknown", arguments: "{}" }
                   }];
                   if (!msg.tool_call_id) {
                       msg.tool_call_id = generatedId;
                   }
              }
          }
          sanitizedMessages.push(msg);
      }

      const strictScrub = (msgs: any[]) => msgs.map(m => {
           if (m.tool_calls && m.tool_calls.length > 0) {
               const { content: _c, ...rest } = m; 
               return rest; 
           }
           if (m.tool_calls && m.tool_calls.length === 0) {
               const { tool_calls: _tc, ...rest } = m;
               return rest;
           }
           return m;
      });

      // 2. Initial Call to Model (with Registry Definitions)
      const finalPayload = strictScrub(sanitizedMessages);
      const tools = toolRegistry.getDefinitions(); 
      
      const reader = await fetchStream(finalPayload, tools, apiKey, this.id);
      
      let toolCallBuffer: any = null;
      let isToolCall = false;

      // 3. Process Stream
      const generator = processStream(reader);
      for await (const chunk of generator) {
          if (chunk.type === "tool_call_chunk") {
              isToolCall = true;
              const tc = chunk.tool_call;
              if (!toolCallBuffer) {
                  toolCallBuffer = {
                      id: tc.id,
                      function: { name: tc.function?.name || "", arguments: tc.function?.arguments || "" }
                  };
              } else {
                  toolCallBuffer.function.arguments += tc.function?.arguments || "";
              }
              continue; 
          }

          if (chunk.type === "text") {
             yield { type: "text", content: chunk.content as string };
          }
      }

      // 4. Delegate Tool Execution to Central Executor
      if (isToolCall && toolCallBuffer) {
           yield* this.executor.executeToolCall(
               toolCallBuffer, 
               formattedMessages, 
               sanitizedMessages, 
               apiKey
           );
      }
      
    } catch (error) {
        console.error("Mistral Adapter Error:", error);
        yield { type: "text", content: `\n\n**Error**: ${(error as Error).message}` };
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
          return "New Chat";
      }
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { MessageNode } from "@/lib/store/chat-store";
import { ModelAdapter } from "../router";
import { ModelConnection } from "./connections";
import { constructSystemPrompt } from "@/lib/core/gateway/prompt-builder";
import { ToolExecutor } from "@/lib/tools/executor";
import { toolRegistry } from "@/lib/tools";
import { chatStore } from "@/lib/store/chat-store";
import { canvasStore } from "@/lib/store/canvas-store";

/**
 * THE UNIFIED GATEWAY 🧠
 * 
 * Takes a "Dumb" Connection (Message In -> Text Out)
 * And adds "Intelligence" (RAG, Tools, Persona, Recursion).
 */
export class Gateway implements ModelAdapter {
  private executor: ToolExecutor;

  constructor(
    public id: string, 
    private connection: ModelConnection
  ) {
    // Initialize the Brain (ToolExecutor)
    // We bind it to our connection's stream Method
    this.executor = new ToolExecutor(id, 
        async (msgs, _key) => {
             // 1. Dynamic Tool Loading (Just-In-Time)
             // We reuse the registry to get definitions
             // (In future we can add 'connectedTools' logic here similar to Mistral)
             const rawTools = await toolRegistry.getDefinitions();
             
             // 2. Load User-Connected Tools (Manual Integration Loading)
             const { loadKlavisTools } = await import("@/lib/tools/klavis-loader");
             const connectedTools = await loadKlavisTools(undefined); // User ID usually undefined in client store context or handled by store
             connectedTools.forEach(t => toolRegistry.register(t));
             
             const allTools = await toolRegistry.getDefinitions();
             
             const tools = allTools.map(t => ({
                type: "function",
                function: {
                   name: t.name,
                   description: t.description,
                   parameters: t.parameters
                }
             }));

             console.log(`[Gateway:${id}] Activating ${tools.length} tools.`);
             return this.connection.createStream(msgs, tools);
        }, 
        (stream) => this.connection.processStream(stream)
    );
  }

  async *streamChat(messages: MessageNode[], userId?: string): AsyncGenerator<import("../router").StreamChunk, void, unknown> {
    try {
      console.log(`[Gateway:${this.id}] Starting request flow...`);

      // 1. RAG & Context Retrieval 📚
      const fileIds = new Set<string>();
      messages.forEach(m => m.attachments?.forEach(a => { if (a.id) fileIds.add(a.id); }));

      let ragContext = "";
      const lastUserMsg = messages[messages.length - 1]?.role === "user" 
          ? messages[messages.length - 1] 
          : messages[messages.length - 2];

      if (fileIds.size > 0 && lastUserMsg && lastUserMsg.content) {
          console.log(`[Gateway] Retrieving RAG context for ${fileIds.size} files...`);
          const { retrieveContext } = await import("@/lib/rag/retriever");
          ragContext = await retrieveContext(lastUserMsg.content, Array.from(fileIds));
      }

      // 2. Message Formatting & Sanitization 🧹
      // Convert Linked List -> Array
      const cleanMessages = messages.filter((m, index) => {
         if (index === messages.length - 1 && m.role === 'assistant') return false;
         return true;
      });

      const formattedMessages: any[] = [];
      
      cleanMessages.forEach(m => {
        const hasToolCalls = (m as any).tool_calls && (m as any).tool_calls.length > 0;
        const hasToolResults = (m as any).tool_results && (m as any).tool_results.length > 0;

        if (!hasToolCalls) {
             const contentParts: any[] = [];
             if (m.content) contentParts.push({ type: "text", text: m.content });
             
             m.attachments?.forEach(file => {
                 // OpenA/Gateway standard for attachments
                 if (file.type.startsWith("image/")) {
                     contentParts.push({ type: "image_url", image_url: { url: file.url || file.content } });
                 } else {
                     const fileText = `\n\n[File Attachment: ${file.name}]\n\`\`\`\n${file.content}\n\`\`\`\n`;
                     contentParts.push({ type: "text", text: fileText });
                 }
             });

             formattedMessages.push({
                 role: m.role as string,
                 content: (contentParts.length === 1 && contentParts[0].type === "text") ? contentParts[0].text : (contentParts.length > 0 ? contentParts : ""),
                 tool_call_id: (m as any).toolCallId,
                 name: (m as any).name
             });
             return;
        }

        // Complex (Tool) Message Re-Construction
        formattedMessages.push({
            role: "assistant",
            content: m.content || null, 
            tool_calls: (m as any).tool_calls
        });

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
      });

      // 3. System Prompt Construction (Persona) 🎭
      const systemPrompt = constructSystemPrompt(
          ragContext, 
          chatStore.personality,
          canvasStore.content, 
          canvasStore.language
      );

      // Inject System Prompt
      const hasSystem = formattedMessages.some(m => m.role === "system");
      if (!hasSystem) {
          formattedMessages.unshift({ role: "system", content: systemPrompt });
      } else {
          // Append to existing
          const sys = formattedMessages[0]; // Assumption
          if (sys.role === 'system') sys.content += "\n\n" + systemPrompt;
      }

      // 4. Initial Recursive Call (The Kickoff) 🚀
      // We start the Executor loop, which calls our 'fetchStreamFn' (connection.createStream)
      
      // We need to conform to what executeToolCall expects for "Sanitized Messages".
      // For now, we pass formattedMessages as sanitized.
      const apiKey = "auto"; // Handled by connection internally

      // To verify if Executor handles the *Initial* call or only *Tool* calls?
      // Executor.executeToolCall handles *Tool Results*. It does not start the chat.
      // MistralAdapter called fetchStream manually first.
      
      // Logic from MistralAdapter:
      // const reader = await fetchStream(finalPayload, tools, apiKey, this.id);
      // const generator = processStream(reader);
      // for await ... check chunk ... if tool call -> yield* executor.executeToolCall
      
      // We must duplicate this "Outer Loop" here.
      
      // 4. Initial Recursive Call (The Kickoff) 🚀
      
      // A. Load Tools (Static + Connected Integrations)
      // We must load this HERE for the initial call, using the userId context
      const { loadKlavisTools } = await import("@/lib/tools/klavis-loader");
      const connectedTools = await loadKlavisTools(userId);
      connectedTools.forEach(t => toolRegistry.register(t));

      const rawTools = await toolRegistry.getDefinitions();
      const tools = rawTools.map(t => ({
           type: "function",
           function: { name: t.name, description: t.description, parameters: t.parameters }
      }));
      
      // B. Call Connection
      const reader = await this.connection.createStream(formattedMessages, tools);
      const generator = this.connection.processStream(reader);
      
      let toolCallBuffer: any = null;
      let isToolCall = false;

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
              yield { type: "text", content: chunk.content };
           }
      }

      // 5. Handover to Executor (recursion) if tool call occurred 🔄
      if (isToolCall && toolCallBuffer) {
           console.log(`[Gateway] Handing over to Executor for tool: ${toolCallBuffer.function.name}`);
           yield* this.executor.executeToolCall(
               toolCallBuffer, 
               formattedMessages, 
               formattedMessages, // using same array for sanitization for now
               apiKey
           );
      }

    } catch (error: any) {
      console.error(`Gateway Error (${this.id}):`, error);
      yield { type: "text", content: `\n\n**Gateway Error**: ${error.message || "Unknown error"}` };
    }
  }
}

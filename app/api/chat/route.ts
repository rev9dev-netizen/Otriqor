/* eslint-disable @typescript-eslint/no-explicit-any */
import { modelRouter } from "@/lib/api/router";
// import { MessageNode } from "@/lib/store/chat-store";
// import { auth } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {

    const body = await req.json();
    const { modelId } = body;
    let { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response("Missing messages", { status: 400 });
    }

    // --- Message Sanitization ---
    // Remove empty messages that cause 400 errors (especially from Mistral/OpenAI)
    messages = messages.filter((m: any) => {
        // Keep if content exists and is not empty
        if (m.content && typeof m.content === 'string' && m.content.trim() !== '') return true;
        
        // Keep if tool_calls exist and are not empty (Assistant tool use)
        if (m.tool_calls && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) return true;
        
        // Keep if it's a Tool Result (role: 'tool') - content is required but check separately
        if (m.role === 'tool') return true; 

        // Drop otherwise (e.g. { role: 'assistant', content: null, tool_calls: undefined })
        return false;
    }).map((m: any) => {
        // Ensure content is string if null (APIs often dislike null content)
        if (m.content === null || m.content === undefined) {
             return { ...m, content: "" };
        }
        return m;
    });
    // ----------------------------

    if (!modelId) {
      return new Response("Missing modelId", { status: 400 });
    }

    // Optional: Check auth if needed, though app seems open for now (or handling auth on client)
    // const session = await auth();
    // if (!session?.user) {
    //   return new Response("Unauthorized", { status: 401 });
    // }

    // Create a ReadableStream from the generator
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            
            try {
                // Call the unified router
                // Note: We might pass userId if we have it from auth()
                const generator = modelRouter.streamChat(modelId, messages);

                for await (const chunk of generator) {
                    // Send chunk as JSON line for easy parsing on client
                    // Or keep it simple text if only streaming text?
                    // Gateway yields 'StreamChunk' objects. 
                    // Best practice: Send NDJSON (Newline Delimited JSON)
                    
                    const payload = JSON.stringify(chunk);
                    controller.enqueue(encoder.encode(payload + "\n"));
                }
            } catch (error: any) {
                console.error("Stream Error:", error);
                const errorPayload = JSON.stringify({ type: "text", content: `\n\n**Error during generation:** ${error.message}` });
                controller.enqueue(encoder.encode(errorPayload + "\n"));
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "application/x-ndjson", // or text/event-stream
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

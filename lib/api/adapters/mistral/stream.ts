/* eslint-disable @typescript-eslint/no-explicit-any */
export const fetchStream = async (msgs: any[], toolsList: any[], apiKey: string, modelId: string) => {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: modelId,
            messages: msgs,
            tools: toolsList,
            tool_choice: toolsList ? "auto" : undefined,
            stream: true
        })
    });

    if (!response.ok) {
         let errorMessage = `Mistral Error ${response.status}`;
         try {
             const errorText = await response.text();
             const errorJson = JSON.parse(errorText);
             errorMessage = errorJson.message || errorJson.error?.message || errorText;
             
             if (response.status === 429) {
                 errorMessage = "Rate limit exceeded. Please try again later.";
             } else if (response.status === 401) {
                 errorMessage = "Invalid API Key or Unauthorized access.";
             } else if (response.status === 422) {
                 errorMessage = "Invalid Input (422): Check payload structure.";
             }
         } catch (e) {
             // Fallback
         }
         throw new Error(errorMessage);
    }
    
    if (!response.body) throw new Error("No response body");
    return response.body.getReader();
};

export const processStream = async function* (reader: ReadableStreamDefaultReader<Uint8Array>) {
    const decoder = new TextDecoder();
    let buffer = "";

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
                      
                      // 1. Tool Calls
                      if (delta?.tool_calls) {
                          const tc = delta.tool_calls[0];
                          yield { type: "tool_call_chunk", tool_call: tc };
                          continue;
                      }

                      // 2. Content
                      if (delta?.content) {
                          let text = "";
                          if (typeof delta.content === 'string') {
                              text = delta.content;
                          } else if (Array.isArray(delta.content)) {
                              text = delta.content
                                  .filter((c: any) => c.type === 'text')
                                  .map((c: any) => c.text)
                                  .join("");
                          }
                          
                          if (text) {
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

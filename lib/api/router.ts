/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { MessageNode } from "@/lib/store/chat-store";

export interface ModelResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export type StreamChunk = 
  | { type: "text"; content: string }
  | { type: "usage"; stats: { tokensPerSec: number; totalTokens: number; timeToFirstToken: number; stopReason: string; } }
  | { type: "tool_result"; content: string; name: string; tool_call_id: string }
  | { type: "tool_call"; tool_call: any }
  | { type: "tool_call_chunk"; tool_call: any };

export interface ModelAdapter {
  id: string;
  streamChat(messages: MessageNode[]): AsyncGenerator<StreamChunk, void, unknown>;
  generateTitle?(messages: MessageNode[]): Promise<string>;
}

// Mock Adapter for Phase 3 scaffolding
class MockAdapter implements ModelAdapter {
  constructor(public id: string) {}

  async *streamChat(_messages: MessageNode[]): AsyncGenerator<StreamChunk, void, unknown> {
    const mockResponses = [
      "Here is a simple example of how that works.",
      "Based on your request, I've analyzed the data.",
      "To solve this, we can use a recursive approach.",
    ];
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    // Simulate streaming characters
    for (const char of randomResponse.split("")) {
      await new Promise((resolve) => setTimeout(resolve, 30)); // 30ms simulation
      yield { type: "text", content: char };
    }
  }
}

import { OpenAIAdapter } from "./adapters/openai";
import { AnthropicAdapter } from "./adapters/anthropic";
import { MistralAdapter } from "./adapters/mistral/index"; // Force directory index
import { adapter } from "next/dist/server/web/adapter";

import { models } from "@/lib/config/models";

class UnifiedRouter {
  private adapters: Map<string, ModelAdapter> = new Map();

  constructor() {
    // Dynamic Registration from Config
    models.forEach(model => {
        if (model.provider === 'openai') {
            this.registerAdapter(new OpenAIAdapter(model.id));
        } else if (model.provider === 'mistral') {
            this.registerAdapter(new MistralAdapter(model.id));
        } else if (model.provider === 'anthropic') {
             // Uncomment to enable Anthropic if key is present
             this.registerAdapter(new AnthropicAdapter(model.id));
        }
    });
  }

  registerAdapter(adapter: ModelAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  async *streamChat(modelId: string, messages: MessageNode[]): AsyncGenerator<StreamChunk, void, unknown> {
    console.log("Router: streaming chat for model:", modelId);
    
    let adapter = this.adapters.get(modelId);
    
    if (!adapter) {
        // Lazy Resolution Strategy
        if (modelId.startsWith("mistral") || modelId.startsWith("codestral") || modelId.startsWith("pixtral") || modelId.startsWith("open-mistral")) {
            adapter = new MistralAdapter(modelId);
        } else if (modelId.startsWith("gpt") || modelId.startsWith("o1") || modelId.startsWith("chatgpt")) {
            adapter = new OpenAIAdapter(modelId);
        } else if (modelId.startsWith("claude")) {
            // Check if user has enabled Anthropic via keys or just try
            adapter = new AnthropicAdapter(modelId);
        }

        if (adapter) {
            console.log(`Router: ⚡ Lazily registered adapter for ${modelId}`);
            this.registersAdapter(adapter);
        }
    }

    if (!adapter) {
       yield { type: "text", content: `I'm sorry, but this model (${modelId}) is not yet connected or recognized. Please select a supported model.` };
       return;
    }
    yield* adapter.streamChat(messages);
  }

  // Renamed internal helper
  registersAdapter(adapter: ModelAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  async generateTitle(modelId: string, messages: MessageNode[]): Promise<string> {
    const adapter = this.adapters.get(modelId);
    if (adapter && adapter.generateTitle) {
        return adapter.generateTitle(messages);
    }
    return "New Chat";
  }
}



export const modelRouter = new UnifiedRouter();

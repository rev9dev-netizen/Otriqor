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
  | { 
      type: "usage"; 
      stats: {
        tokensPerSec: number;
        totalTokens: number;
        timeToFirstToken: number;
        stopReason: string;
      } 
    }
  | { type: "tool_result"; content: string; name: string };

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
import { MistralAdapter } from "./adapters/mistral";
import { adapter } from "next/dist/server/web/adapter";

class UnifiedRouter {
  private adapters: Map<string, ModelAdapter> = new Map();

  constructor() {
    this.registerAdapter(new OpenAIAdapter("gpt-4o"));
    // this.registerAdapter(new AnthropicAdapter("claude-3-5-sonnet"));
    this.registerAdapter(new MistralAdapter("mistral-large-latest"));
  }

  registerAdapter(adapter: ModelAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  async *streamChat(modelId: string, messages: MessageNode[]): AsyncGenerator<StreamChunk, void, unknown> {
    const adapter = this.adapters.get(modelId);
    if (!adapter) {
       yield { type: "text", content: "I'm sorry, but this model is not yet connected. Please select Mistral Large (currently active)." };
       return;
    }
    yield* adapter.streamChat(messages);
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

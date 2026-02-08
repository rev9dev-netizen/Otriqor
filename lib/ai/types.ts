/* eslint-disable @typescript-eslint/no-explicit-any */
import { Zap, Sparkles, Brain, Terminal, Eye, Globe } from "lucide-react";

export type ProviderId = "openai" | "anthropic" | "mistral" | "gemini" | "deepseek" | "zhipu" | "huggingface" | "groq" | "meta" | "xai";

export interface Model {
  maxTokens: number;
  id: string;
  name: string;
  description: string;
  provider: ProviderId;
  tier: 'flagship' | 'mode' | 'other';
  usageTier: 'free' | 'paid';
  enabled: boolean;
  capabilities: {
    thinking: any;
    webSearch: any;
    functionCall: any;
    vision: boolean;
    tools: boolean;
  };
  icon: any;
  contextWindow?: number;
}


/**
 * The Runtime Connection Interface (The Pipe)
 * Handles the actual HTTP/SDK communication.
 */
export interface ModelConnection {
    id: string;
    createStream(messages: any[], tools?: any[]): Promise<any>;
    processStream(stream: any): AsyncGenerator<any>;
}

/**
 * The Static Provider Configuration (The Registry)
 * Defines the models, logos, and features for a provider.
 */
export interface AIProvider {
    id: string; // e.g. "openai", "mistral"
    name: string;
    logo: string;
    
    // Connection Factory
    createConnection(modelId: string): ModelConnection;
    
    // Static Models List
    models: Model[];
    
    // Dedicated Title Model ID (Optional - Lightweight model for this provider)
    titleModelId?: string;

    // API Config (for internal use by adapter)
    config: {
        apiKeyEnv: string;
        baseURL?: string;
    };
}

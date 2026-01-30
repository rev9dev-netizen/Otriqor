/* eslint-disable @typescript-eslint/no-explicit-any */
import { Zap, Sparkles, Brain, Code, Terminal, Eye, Globe } from "lucide-react";

export type ProviderId = "openai" | "anthropic" | "mistral" | "gemini" | "deepseek";

export interface Model {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  icon: any; 
  provider: ProviderId;
  capabilities: {
    vision: boolean;
    thinking: boolean;
    webSearch: boolean;
    functionCall: boolean;
  };
}

export const models: Model[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "Fastest flagship model",
    maxTokens: 128000,
    icon: Zap,
    provider: "openai",
    capabilities: {
      vision: true,
      thinking: false,
      webSearch: true,
      functionCall: true,
    },
  },
  {
    id: "mistral-large-latest",
    name: "Mistral Large",
    description: "Top-tier reasoning & coding",
    maxTokens: 32000,
    icon: Sparkles,
    provider: "mistral",
    capabilities: {
      vision: false,
      thinking: true,
      webSearch: false,
      functionCall: true,
    },
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "Best for coding & nuance",
    maxTokens: 200000,
    icon: Brain,
    provider: "anthropic",
    capabilities: {
      vision: true,
      thinking: true,
      webSearch: false,
      functionCall: true,
    },
  },
];

export const providers: Record<ProviderId, { name: string; logo: string; colors: { text: string; bg: string; border: string } }> = {
  openai: {
    name: "OpenAI",
    logo: "https://cdn.brandfetch.io/openai.com/w/800/h/800/symbol?c=1id05yjbcK2xcWSgXSu",
    colors: {
      text: "text-green-400",
      bg: "bg-green-500/20",
      border: "border-green-500/20",
    }
  },
  anthropic: {
    name: "Anthropic",
    logo: "https://cdn.brandfetch.io/claude.ai/w/338/h/338?c=1id05yjbcK2xcWSgXSu",
    colors: {
      text: "text-orange-400",
      bg: "bg-orange-500/20",
      border: "border-orange-500/20",
    }
  },
  mistral: {
    name: "Mistral",
    logo: "https://cdn.brandfetch.io/mistral.ai/w/820/h/578/logo?c=1id05yjbcK2xcWSgXSu",
    colors: {
      text: "text-indigo-400",
      bg: "bg-indigo-500/20",
      border: "border-indigo-500/20",
    }
  },
  gemini: {
    name: "Google Gemini",
    logo: "https://cdn.brandfetch.io/google.com/icon/theme/light/symbol?c=1id05yjbcK2xcWSgXSu", // Generic Google for now or specific Gemini if found
    colors: {
        text: "text-blue-400",
        bg: "bg-blue-500/20",
        border: "border-blue-500/20",
    }
  },
  deepseek: {
    name: "DeepSeek",
    logo: "https://cdn.brandfetch.io/deepseek.com/icon/theme/light/symbol?c=1id05yjbcK2xcWSgXSu", // Placeholder
    colors: {
        text: "text-cyan-400",
        bg: "bg-cyan-500/20",
        border: "border-cyan-500/20",
    }
  }
};

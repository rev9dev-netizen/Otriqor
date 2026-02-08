import { Zap } from "lucide-react";
import { AIProvider } from "../../types";
import { OpenAIAdapter } from "./adapter";
import { Model } from "@/lib/config/models";

export const openai: AIProvider = {
    id: "openai",
    name: "OpenAI",
    logo: "/model-logo/openai.svg",
    titleModelId: "gpt-4o-mini",
    config: {
        apiKeyEnv: "OPENAI_API_KEY"
    },
    createConnection: (modelId: string) => {
        return new OpenAIAdapter(modelId, { 
            apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || "" 
        });
    },
    models: [
        {
            id: "gpt-5.2",
            name: "GPT-5.2",
            description: "Flagship Logic & Reasoning",
            provider: "openai",
            tier: "flagship",
            usageTier: "paid",
            enabled: true,
            capabilities: { vision: true, tools: true },
            icon: Zap,
        },
        {
            id: "gpt-5.1",
            name: "GPT-5.1",
            description: "Previous Logic Step",
            provider: "openai",
            tier: "mode",
            usageTier: "paid",
            enabled: false, 
            capabilities: { vision: true, tools: true },
            icon: Zap,
        },
        {
            id: "gpt-4o",
            name: "GPT-4o",
            description: "High Efficiency Multimodal",
            provider: "openai",
            tier: "mode",
            usageTier: "paid",
            enabled: false,
            capabilities: { vision: true, tools: true },
            icon: Zap,
        },
        {
            id: "gpt-3.5-turbo",
            name: "GPT-3.5 Turbo",
            description: "Legacy / Lightweight",
            provider: "openai",
            tier: "mode",
            usageTier: "free",
            enabled: false,
            capabilities: { vision: false, tools: true },
            icon: Zap,
        },
        {
            id: "gpt-4o-mini", // Designated Title Model
            name: "GPT-4o Mini",
            description: "Title Generation Specialist",
            provider: "openai",
            tier: "other",
            usageTier: "free",
            enabled: false, 
            capabilities: { vision: false, tools: true },
            icon: Zap,
        }
    ] as Model[]
};

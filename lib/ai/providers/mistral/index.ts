import { Sparkles } from "lucide-react";
import { AIProvider } from "../../types";
import { MistralAdapter } from "./adapter";
import { Model } from "@/lib/config/models";

export const mistral: AIProvider = {
    id: "mistral",
    name: "Mistral AI",
    logo: "/model-logo/mistral.svg",
    titleModelId: "mistral-small-latest", 
    config: {
        apiKeyEnv: "MISTRAL_API_KEY"
    },
    createConnection: (modelId: string) => {
        return new MistralAdapter(modelId, process.env.MISTRAL_API_KEY || process.env.NEXT_PUBLIC_MISTRAL_API_KEY || "");
    },
    models: [
        {
            id: "mistral-large-latest",
            name: "Mistral Large",
            description: "Mistral Flagship",
            provider: "mistral",
            tier: "mode", 
            usageTier: "paid", 
            enabled: false,
            capabilities: { vision: false, tools: true },
            icon: Sparkles,
        },
        {
            id: "mistral-large-2512", // Mistral Large 3
            name: "Mistral Large 3",
            description: "State-of-the-art Multimodal (Free)",
            provider: "mistral",
            tier: "flagship", 
            usageTier: "free", 
            enabled: true,
            capabilities: { vision: true, tools: true }, 
            icon: Sparkles,
        },
        {
            id: "mistral-small-latest",
            name: "Mistral Small",
            description: "Efficiency",
            provider: "mistral",
            tier: "other",
            usageTier: "free",
            enabled: false,
            capabilities: { vision: false, tools: true },
            icon: Sparkles,
        },
    ] as Model[]
};

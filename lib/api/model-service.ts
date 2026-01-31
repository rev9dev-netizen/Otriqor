/* eslint-disable @typescript-eslint/no-explicit-any */
import { initProviders, getModels } from "@/lib/model-router";
import { UnifiedModel } from "@/lib/model-router/core/types";

// Match frontend Model interface structure
export interface DynamicModel {
    id: string;
    name: string;
    description: string;
    maxTokens: number;
    provider: "openai" | "mistral" | "anthropic" | "gemini" | "deepseek"; 
    capabilities: {
        vision: boolean;
        functionCall: boolean;
        thinking?: boolean; 
        webSearch: boolean;
    };
}

let initialized = false;

async function ensureInitialized() {
    if (initialized) return;

    const mistralKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY || process.env.MISTRAL_API_KEY;

    const configs = [];
    if (mistralKey) {
        configs.push({
            name: "mistral",
            baseUrl: "https://api.mistral.ai/v1",
            apiKey: mistralKey
        });
    }

    await initProviders(configs);
    initialized = true;
}

function mapToDynamic(m: UnifiedModel): DynamicModel {
    return {
        id: m.id,
        name: m.id.split(/[-_]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        description: `Dynamic ${m.provider} model`, // Placeholder, could be enhanced with metadata dict
        maxTokens: m.contextWindow || 8192,
        provider: m.provider as any,
        capabilities: {
            vision: !!m.supportsVision,
            functionCall: !!m.supportsTools,
            thinking: false,
            webSearch: false 
        }
    };
}

export async function fetchAllModels(): Promise<DynamicModel[]> {
    await ensureInitialized();
    const coreModels = getModels();
    return coreModels.map(mapToDynamic);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { MistralConnection } from "../gateway/connections/mistral";

export class MistralProvider {
    /**
     * Heuristic to check if a model ID belongs to Mistral.
     * Allows accepting "any model" that looks like a Mistral model.
     */
    static isProviderFor(modelId: string): boolean {
        const id = modelId.toLowerCase();
        return id.startsWith("mistral") || 
               id.startsWith("mixtral") || 
               id.startsWith("codestral") ||
               id.includes("mistral");
    }

    /**
     * Creates a standardized connection for Mistral models.
     */
    static createConnection(modelId: string): any {
        const apiKey = process.env.MISTRAL_API_KEY || process.env.NEXT_PUBLIC_MISTRAL_API_KEY || "";
        
        return new MistralConnection(modelId, apiKey);
    }
}

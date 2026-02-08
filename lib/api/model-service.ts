import { models, Model } from "@/lib/config/models";

// Simple Static Loader - No Probing, No Dynamic Discovery for now (or strictly constrained)
export async function fetchAllModels(): Promise<Model[]> {
    // Return static configuration directly. 
    // "All other models: May be fetched internally... Must remain disabled"
    // For this reset, we start by returning only the static list which implicitly handles this
    // (since only explicit models are defined, everything else is effectively 'not present' or could be added here as disabled)
    return models;
}

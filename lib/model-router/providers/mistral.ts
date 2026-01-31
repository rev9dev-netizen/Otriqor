import { ProviderAdapter } from "./base"
import { ProviderConfig, RawModel, UnifiedModel } from "../core/types"

export const mistralAdapter: ProviderAdapter = {
  name: "mistral",

  async listModels(config: ProviderConfig): Promise<RawModel[]> {
    const r = await fetch(`${config.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.apiKey}` }
    })

    if (!r.ok) throw new Error("model_list_failed")

    const j = await r.json()
    return j.data || j.models || []
  },

  normalizeModel(raw: RawModel): UnifiedModel {
    const isVision = raw.id.includes('pixtral');
    // Heuristic for context window if not provided
    // Mistral API doesn't always return context_window in list response clearly for all endpoints
    // But we can check if it exists in raw.
    const contextWindow = raw.max_context_length || raw.context_window || 32000;

    return {
      id: raw.id,
      provider: "mistral",
      contextWindow: contextWindow,
      supportsVision: isVision,
      supportsTools: true, // Most modern Mistral models support tools
      supportsStreaming: true
    }
  },

  async probeModel(config: ProviderConfig, modelId: string): Promise<void> {
    const r = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 2,
        stream: false 
      })
    })

    if (!r.ok) {
      const t = await r.text()
      try {
          const errJson = JSON.parse(t);
          throw new Error(errJson.error?.message || errJson.message || t);
      } catch (e) {
          throw new Error(t)
      }
    }
  }
}

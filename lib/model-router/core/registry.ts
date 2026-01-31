import { UnifiedModel, ModelAccess, ProviderConfig } from "./types"
import { probeAccess } from "./probe"
import { ProviderAdapter } from "../providers/base"

const TTL = 1000 * 60 * 60 * 12 // 12h

export class ModelRegistry {

  models = new Map<string, UnifiedModel>()
  access = new Map<string, ModelAccess>()

  key(provider: string, model: string): string {
    return `${provider}:${model}`
  }

  async loadProvider(adapter: ProviderAdapter, config: ProviderConfig) {

    const rawModels = await adapter.listModels(config)

    for (const raw of rawModels) {

      const model = adapter.normalizeModel(raw)
      const k = this.key(model.provider, model.id)

      this.models.set(k, model)

      const acc = this.access.get(k)

      if (!acc || Date.now() - acc.lastChecked > TTL) {

        const res = await probeAccess(adapter, config, model.id)
        this.access.set(k, res)
      }
    }
  }

  getUsableModels(): UnifiedModel[] {
    return [...this.models.values()].filter(m =>
      this.access.get(this.key(m.provider, m.id))?.usable
    )
  }
}

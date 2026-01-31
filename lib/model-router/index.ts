import { ModelRegistry } from "./core/registry"
import { mistralAdapter } from "./providers/mistral"
import { ProviderConfig, UnifiedModel } from "./core/types"

const registry = new ModelRegistry()

export async function initProviders(configs: ProviderConfig[]) {

  for (const cfg of configs) {

    if (cfg.name === "mistral")
      await registry.loadProvider(mistralAdapter, cfg)

    // add more adapters here (openai, anthropic) when we implement them
  }
}

export function getModels(): UnifiedModel[] {
  return registry.getUsableModels()
}

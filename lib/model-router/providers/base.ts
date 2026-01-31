import { RawModel, UnifiedModel, ProviderConfig } from "../core/types"

export interface ProviderAdapter {
  name: string

  listModels(config: ProviderConfig): Promise<RawModel[]>

  normalizeModel(raw: RawModel): UnifiedModel

  probeModel(config: ProviderConfig, modelId: string): Promise<void>

  testVision?(config: ProviderConfig, modelId: string): Promise<boolean>

  testTools?(config: ProviderConfig, modelId: string): Promise<boolean>
}

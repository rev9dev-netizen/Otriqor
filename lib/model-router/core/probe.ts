/* eslint-disable @typescript-eslint/no-explicit-any */
import { classifyError } from "./errors"
import { ProviderAdapter } from "../providers/base"
import { ProviderConfig, ModelAccess } from "./types"

export async function probeAccess(
  adapter: ProviderAdapter, 
  config: ProviderConfig, 
  modelId: string
): Promise<ModelAccess> {

  try {
    await adapter.probeModel(config, modelId)

    return {
      usable: true,
      lastChecked: Date.now()
    }

  } catch (e: any) {

    return {
      usable: false,
      errorType: classifyError(e.message),
      lastChecked: Date.now()
    }
  }
}

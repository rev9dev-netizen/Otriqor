/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RawModel {
  id: string
  [key: string]: any
}

export interface UnifiedModel {
  id: string
  provider: string
  contextWindow?: number
  supportsVision?: boolean
  supportsTools?: boolean
  supportsStreaming?: boolean
}

export interface ModelAccess {
  usable: boolean
  errorType?: string
  lastChecked: number
}

export interface ProviderConfig {
  name: string
  baseUrl: string
  apiKey: string
}

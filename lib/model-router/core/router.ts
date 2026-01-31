import { UnifiedModel } from "./types"

export interface TaskRequirements {
    vision?: boolean;
    tools?: boolean;
    longContext?: boolean;
    streaming?: boolean;
}

export function scoreModel(m: UnifiedModel, task: TaskRequirements): number {

  let score = 0

  if (task.vision && m.supportsVision) score += 5
  if (task.tools && m.supportsTools) score += 4
  if (task.longContext && m.contextWindow) score += m.contextWindow / 10000

  return score
}

export function route(models: UnifiedModel[], task: TaskRequirements): UnifiedModel | undefined {

  return models
    .map(m => ({ m, s: scoreModel(m, task) }))
    .sort((a,b) => b.s - a.s)[0]?.m
}

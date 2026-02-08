/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * ActionAST: The Canonical Contract for Model Intents.
 * Every model output must be normalized into this structure before execution.
 */
export type ActionAST =
  | MessageAction
  | ToolCallAction
  | PlanAction
  | ErrorAction;

/**
 * Represents a standard text response from the model.
 */
export interface MessageAction {
  type: "message";
  content: string;
  role: "assistant" | "system" | "user"; // Normalized role
  metadata?: Record<string, any>; // Citations, thinking process, etc.
}

/**
 * Represents a specific intent to execute a tool.
 */
export interface ToolCallAction {
  type: "tool_call";
  tool: string; // Name of the tool (e.g., 'gmail_action')
  args: Record<string, any>; // Validated arguments
  id: string; // Correlation ID (required for API callback)
}

/**
 * Represents a multi-step plan (optional for now, but future-proofs the system).
 */
export interface PlanAction {
  type: "plan";
  steps: ActionAST[];
}

/**
 * Represents a failure to understand or validate intent.
 * The runtime handles this (e.g., by creating a self-correction prompt).
 */
export interface ErrorAction {
  type: "error";
  reason: string;
  recoverable: boolean;
  rawInput?: any; // The original input that caused the error
}

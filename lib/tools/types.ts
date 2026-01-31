export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, any>; // JSON Schema
}

export interface ToolExecutionResult {
    content: string; // The result to send back to the LLM (usually JSON string)
    blobs?: { type: "image" | "file"; data: string; mimeType: string }[];
    error?: string;
}

export interface ToolContext {
    searchEnabled?: boolean;
    // Add other context overrides if needed
}

export interface Tool {
    definition: ToolDefinition;
    /**
     * Execute the tool with parsed arguments.
     * Should return a JSON-stringifiable object or a ToolExecutionResult.
     */
    execute: (args: any, context?: ToolContext) => Promise<ToolExecutionResult>;
}

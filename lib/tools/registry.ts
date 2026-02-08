/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: any;
    execute: (args: any) => Promise<any>;
}

export class ToolRegistry {
    private tools: Map<string, ToolDefinition> = new Map();

    /**
     * Register a tool
     */
    register(tool: ToolDefinition) {
        this.tools.set(tool.name, tool);
    }

    /**
     * Check if a tool exists
     */
    has(name: string): boolean {
        return this.tools.has(name);
    }

    /**
     * Get tool definitions formatted for API calls
     */
    async getDefinitions(): Promise<ToolDefinition[]> {
        const definitions = Array.from(this.tools.values());
        console.log(`[ToolRegistry] Returning ${definitions.length} tools`);
        return definitions;
    }

    /**
     * Execute a tool by name
     */
    async execute(name: string, args: any): Promise<any> {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool "${name}" not found in registry`);
        }
        
        console.log(`[ToolRegistry] Executing ${name}`);
        return tool.execute(args);
    }

    /**
     * Get all tool names
     */
    getToolNames(): string[] {
        return Array.from(this.tools.keys());
    }

    /**
     * Clear all tools
     */
    clear() {
        this.tools.clear();
    }
}

export const toolRegistry = new ToolRegistry();

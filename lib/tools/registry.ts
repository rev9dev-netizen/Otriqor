import { Tool, ToolDefinition } from "./types";

class Registry {
    private tools = new Map<string, Tool>();

    register(tool: Tool) {
        if (this.tools.has(tool.definition.name)) {
            console.warn(`Tool '${tool.definition.name}' is already registered. Overwriting.`);
        }
        this.tools.set(tool.definition.name, tool);
    }

    getTool(name: string): Tool | undefined {
        return this.tools.get(name);
    }

    getDefinitions(): { type: "function"; function: ToolDefinition }[] {
        return Array.from(this.tools.values()).map(t => ({
            type: "function",
            function: t.definition
        }));
    }

    async execute(name: string, args: any, context?: any): Promise<any> {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool '${name}' not found.`);
        }
        try {
            return await tool.execute(args, context);
        } catch (error) {
            console.error(`Error executing tool '${name}':`, error);
            return {
                error: error instanceof Error ? error.message : "Unknown error",
                content: JSON.stringify({ error: "Tool execution failed" })
            };
        }
    }
}

export const toolRegistry = new Registry();

/* eslint-disable @typescript-eslint/no-explicit-any */
import { ToolDefinition } from "@/lib/tools/registry";
import { runKlavisToolAction, discoverKlavisToolsAction } from "@/app/actions/klavis";
import { getConnectedIntegrations } from "@/app/actions/integrations";

/**
 * Simple Klavis tool loader
 * Loads tools for all connected integrations
 */
export async function loadKlavisTools(userId?: string): Promise<ToolDefinition[]> {
    console.log(`[KlavisLoader] Loading tools for connected integrations (User: ${userId || "auth"})...`);

    try {
        // Get connected integrations from database
        const result = await getConnectedIntegrations(userId);
        
        if (!result.success || !result.integrations || result.integrations.length === 0) {
            console.log("[KlavisLoader] No connected integrations");
            return [];
        }

        const definitions: ToolDefinition[] = [];

        // For each connected integration, create tool definitions
        for (const integration of result.integrations) {
            const strataId = integration.strata_id;
            const name = integration.integration_name;

            try {
                // Discover actual tools from Klavis (via Server Action to avoid CORS)
                console.log(`[KlavisLoader] Discovering tools for ${name} (Strata: ${strataId})...`);
                const discovery = await discoverKlavisToolsAction(strataId);
                const tools = discovery.success ? { tools: discovery.tools } : null;

                if (tools && tools.tools && tools.tools.length > 0) {
                    console.log(`[KlavisLoader] Found ${tools.tools.length} tools for ${name}:`, tools.tools.map((t: any) => t.name).join(", "));
                    
                    for (const tool of (tools.tools as any[])) {
                        definitions.push({
                            name: tool.name,
                            description: tool.description || `Action for ${name}`,
                            parameters: tool.inputSchema || {},
                            execute: async (args: any) => {
                                console.log(`[KlavisLoader] Executing ${tool.name}:`, args);
                                const res = await runKlavisToolAction(strataId, tool.name, args);
                                return res.success ? res.result : (res.error || "Failed to execute");
                            }
                        });
                    }
                } else {
                    console.log(`[KlavisLoader] No specific tools found for ${name}, using generic.`);
                    // Fallback to generic
                    definitions.push(createGenericTool(name, strataId));
                }
            } catch (err) {
                 console.error(`[KlavisLoader] Discovery failed for ${name}:`, err);
                 // Fallback to generic
                 definitions.push(createGenericTool(name, strataId));
            }
        }

        console.log(`[KlavisLoader] Loaded ${definitions.length} tools`);
        return definitions;

    } catch (e) {
        console.error("[KlavisLoader] Failed to load tools:", e);
        return [];
    }
}

function createGenericTool(name: string, strataId: string): ToolDefinition {
    return {
        name: `${name}_action`,
        description: `Perform actions with ${name}. Use this if specific tools aren't available.`,
        parameters: {
            type: "object",
            properties: {
                action: { type: "string" },
                query: { type: "string" }
            },
            required: ["action"]
        },
        execute: async (args: any) => {
             const res = await runKlavisToolAction(strataId, args.action, args);
             return res.success ? res.result : (res.error || "Failed to execute");
        }
    };
}

/**
 * Initialize Klavis tools on app startup (client-side usually)
 */
export async function initKlavisTools(userId?: string) {
    const { toolRegistry } = await import("@/lib/tools/registry");
    const tools = await loadKlavisTools(userId);
    tools.forEach(tool => toolRegistry.register(tool));
    console.log(`[KlavisLoader] Registered ${tools.length} Klavis tools in registry`);
}

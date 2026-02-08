/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Tool classification for the Policy layer.
 * Determines how the Runtime handles different tool types.
 */
export type ToolKind = "discovery" | "execution" | "utility";

export interface ToolPolicy {
    name: string;
    kind: ToolKind;
    /**
     * If true, the Planner will auto-chain follow-up tools.
     * E.g., discovery tools might auto-chain to action-fetching tools.
     */
    requiresChaining?: boolean;
    /**
     * The tool to chain to after this one completes (if applicable).
     */
    chainTo?: string;
}

/**
 * Policy Registry: Maps tool names to their policies.
 * This is the single source of truth for tool behavior classification.
 */
const TOOL_POLICIES: Record<string, ToolPolicy> = {
    // Klavis Discovery Tools
    "discover_server_categories_or_actions": {
        name: "discover_server_categories_or_actions",
        kind: "discovery",
        requiresChaining: true,
        chainTo: "get_category_actions"
    },
    "get_category_actions": {
        name: "get_category_actions",
        kind: "discovery",
        requiresChaining: false
    },
    // Execution Tools (dynamically added, but these are common patterns)
    "gmail_action": { name: "gmail_action", kind: "execution" },
    "youtube_action": { name: "youtube_action", kind: "execution" },
    // Utility Tools
    "web_search": { name: "web_search", kind: "utility" },
    "get_stock": { name: "get_stock", kind: "utility" },
};

export class Policy {
    /**
     * Get the policy for a given tool.
     * Returns a default "execution" policy if not explicitly defined.
     */
    static getPolicy(toolName: string): ToolPolicy {
        return TOOL_POLICIES[toolName] || { name: toolName, kind: "execution" };
    }

    /**
     * Check if a tool requires automatic chaining.
     */
    static requiresChaining(toolName: string): boolean {
        const policy = this.getPolicy(toolName);
        return policy.requiresChaining === true;
    }

    /**
     * Get the next tool to chain to (if any).
     */
    static getChainTarget(toolName: string): string | undefined {
        const policy = this.getPolicy(toolName);
        return policy.chainTo;
    }

    /**
     * Register a new tool policy dynamically.
     * Useful for Klavis tools loaded at runtime.
     */
    static registerPolicy(policy: ToolPolicy): void {
        TOOL_POLICIES[policy.name] = policy;
    }
}

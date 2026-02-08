/* eslint-disable @typescript-eslint/no-explicit-any */
import { Policy } from "./policy";
import { ToolCallAction } from "../contracts/action";

/**
 * ExecutionPlan: What the Executor should do next.
 */
export type ExecutionPlan = 
    | { kind: "execute"; action: ToolCallAction }
    | { kind: "chain"; actions: ToolCallAction[] }
    | { kind: "noop" };

/**
 * Planner: Interprets ActionAST and produces ExecutionPlans.
 * This is where multi-step logic lives (e.g., discovery -> get_actions).
 */
export class Planner {

    /**
     * Given a ToolCallAction, determine the execution plan.
     * If the tool requires chaining, the plan will include follow-up actions.
     */
    static plan(action: ToolCallAction): ExecutionPlan {
        const toolName = action.tool;

        // Check if this tool requires chaining
        if (Policy.requiresChaining(toolName)) {
            const chainTarget = Policy.getChainTarget(toolName);
            if (chainTarget) {
                console.log(`[Planner] Tool '${toolName}' requires chaining to '${chainTarget}'`);
                return {
                    kind: "chain",
                    actions: [
                        action,
                        {
                            type: "tool_call",
                            tool: chainTarget,
                            args: {}, // Will be populated by result of first action
                            id: "chain_" + Math.random().toString(36).substr(2, 9)
                        }
                    ]
                };
            }
        }

        // Default: single execution
        return { kind: "execute", action };
    }

    /**
     * Update a chained action's arguments based on the result of the previous action.
     * This is called after the first action completes.
     */
    static prepareChainedArgs(previousResult: any, chainedAction: ToolCallAction): ToolCallAction {
        // Parse the result to extract categories (Klavis-specific logic)
        try {
            const data = typeof previousResult === 'string' ? JSON.parse(previousResult) : previousResult;
            
            // Check for Klavis discovery format
            if (data?.result?.content) {
                const textContent = data.result.content[0]?.text;
                if (textContent) {
                    const innerData = JSON.parse(textContent);
                    const servers = innerData.servers || {};
                    
                    const categoriesToFetch: string[] = [];
                    for (const info of Object.values(servers) as any[]) {
                        if (info.detail_level === 'categories_only' && Array.isArray(info.details)) {
                            categoriesToFetch.push(...info.details);
                        }
                    }

                    if (categoriesToFetch.length > 0) {
                        console.log(`[Planner] Extracted categories for chaining: ${categoriesToFetch.join(", ")}`);
                        return {
                            ...chainedAction,
                            args: { category_names: categoriesToFetch }
                        };
                    }
                }
            }
        } catch (err) {
            console.error("[Planner] Failed to prepare chained args:", err);
        }

        return chainedAction;
    }
}

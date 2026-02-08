/* eslint-disable @typescript-eslint/no-explicit-any */

export type DiscoveryResult = {
    needsChaining: boolean;
    nextToolCall?: {
        name: string;
        args: any;
    };
    systemGuidance?: string;
};

/**
 * Controller to handle Discovery -> Execution transitions.
 * Keeps the Executor "dumb" and centralization discovery logic here.
 */
export class DiscoveryController {

    /**
     * Inspects a tool result and determines if system-level orchestration is needed.
     * E.g. If Klavis returns 'categories_only', we auto-fetch actions.
     */
    static async handleToolResult(toolName: string, result: any): Promise<DiscoveryResult> {
        
        // Strategy: Klavis Auto-Discovery
        if (toolName === 'discover_server_categories_or_actions') {
            return this.handleKlavisDiscovery(result);
        }

        return { needsChaining: false };
    }

    private static async handleKlavisDiscovery(rawResult: any): Promise<DiscoveryResult> {
        try {
            const data = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;

            // Check if result has "servers" and any server is "categories_only"
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
                         console.log(`[DiscoveryController] Auto-Chaining: Found categories ${categoriesToFetch.join(", ")}. returning execution plan...`);
                         
                         return { 
                             needsChaining: true, 
                             nextToolCall: {
                                name: 'get_category_actions',
                                args: { category_names: categoriesToFetch }
                             },
                             systemGuidance: "Discovery complete. You now have the list of available actions (above). Please proceed to execute the relevant action to fulfill the user request (e.g. list_emails)."
                         };
                     }
                 }
            }
        } catch (err) {
            console.error("[DiscoveryController] Error parsing result:", err);
        }
        
        return { needsChaining: false };
    }
}

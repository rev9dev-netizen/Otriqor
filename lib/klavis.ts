/* eslint-disable @typescript-eslint/no-explicit-any */
import { KlavisClient } from 'klavis';

const apiKey = process.env.NEXT_PUBLIC_KLAVIS_API_KEY;

if (!apiKey) {
    console.warn("Missing NEXT_PUBLIC_KLAVIS_API_KEY");
}

let clientInstance: KlavisClient | null = null;

export const getKlavisClient = () => {
    if (!clientInstance) {
        clientInstance = new KlavisClient({ 
            apiKey: apiKey || 'demo' 
        });
    }
    return clientInstance;
};

export const createStrata = async (userId: string = 'user123', servers: string[] = ['GMAIL']) => {
    const client = getKlavisClient();
    try {
        const response = await client.mcpServer.createStrataServer({
            userId,
            servers: servers as any, // Cast to avoid enum issues for now
        });
        return response;
    } catch (error) {
        console.error("Failed to create Klavis strata:", error);
        return null;
    }
};

export const listKlavisTools = async (strataId: string) => {
    const client = getKlavisClient();
    
    // Get Strata URL
    const strata = await client.mcpServer.getStrataServer(strataId);
    if (!strata || !strata.strataServerUrl) {
        throw new Error(`Could not find server URL for Strata ${strataId}`);
    }

    // List all tools aggregated by Strata
    return await client.mcpServer.listTools({
        serverUrl: strata.strataServerUrl
    });
};

export const executeKlavisTool = async (strataId: string, toolName: string, args: any) => {
    const client = getKlavisClient();
    // To execute, we use callTools. It needs serverUrl usually?
    // Or maybe we use the strata URL?
    // The SDK documentation for callTools says:
    // callTools(request: Klavis.CallToolRequest)
    // request has serverUrl.
    
    // We need to get the strata details to find the correct URL to call?
    // Or maybe there is a direct way.
    
    // Get the strata connection details to find the correct URL
    try {
        const strata = await client.mcpServer.getStrataServer(strataId);
        
        if (!strata || !strata.strataServerUrl) {
            throw new Error(`Could not find server URL for Strata ${strataId}`);
        }

        console.log(`[Klavis] Executing ${toolName} on ${strata.strataServerUrl}`);
        console.log(`[Klavis] Tool Arguments:`, JSON.stringify(args, null, 2));

        const result = await client.mcpServer.callTools({
            serverUrl: strata.strataServerUrl,
            toolName: toolName,
            toolArgs: args || {}
        });

        console.log(`[Klavis] Execution Result:`, result ? "Success" : "No Result");
        return result;
    } catch (error) {
        console.error("Klavis tool execution failed:", error);
        // Helper: Check for 422 and give hint
        if ((error as any)?.message?.includes('422')) {
            console.error("[Klavis] 422 Error Details - Check if toolArgs match schema:", args);
        }
        return { 
            error: (error as Error).message,
            content: [{ type: "text", text: `Error executing tool: ${(error as Error).message}` }]
        };
    }
};

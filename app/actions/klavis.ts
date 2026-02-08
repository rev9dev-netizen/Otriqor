/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";



import { createStrata, executeKlavisTool as executeKlavisToolLib, listKlavisTools } from "@/lib/klavis";
import { getSupabase } from "@/app/actions/integrations";
import { createClient } from "@supabase/supabase-js";

/**
 * Get or create a Klavis Strata session for a user
 */
export async function getKlavisToolsAction(userId: string, serverNames: string[]): Promise<{
    success: boolean;
    strataId?: string;
    error?: string;
}> {
    try {
        console.log(`[ServerAction] Getting Strata for ${serverNames.join(", ")}`);
        
        // Check if we already have a Strata ID for these servers
        let supabase;
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
             supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!, 
                process.env.SUPABASE_SERVICE_ROLE_KEY!
             );
        } else {
             supabase = await getSupabase();
        }

        const serverKey = serverNames[0]?.toLowerCase();
        
        const { data: existing } = await supabase
            .from("user_integrations")
            .select("strata_id")
            .eq("user_id", userId)
            .eq("integration_name", serverKey)
            .single();
        
        if (existing?.strata_id) {
            console.log(`[ServerAction] Reusing existing Strata: ${existing.strata_id}`);
            return { success: true, strataId: existing.strata_id };
        }

        // Create new Strata session
        const response = await createStrata(userId, serverNames);
        
        if (!response) {
            return { success: false, error: "Failed to create Strata session" };
        }

        const strataId = response.strataId;
        console.log(`[ServerAction] Created new Strata: ${strataId}`);

        // Save to database
        await supabase.from("user_integrations").upsert({
            user_id: userId,
            integration_name: serverKey,
            strata_id: strataId,
            connected_at: new Date().toISOString()
        }, { onConflict: "user_id,integration_name" });

        return { success: true, strataId };

    } catch (e) {
        console.error(`[ServerAction] Error:`, e);
        return { success: false, error: String(e) };
    }
}

/**
 * Execute a Klavis tool action
 */
export async function runKlavisToolAction(
    strataId: string,
    toolName: string,
    args: Record<string, any>
): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
        console.log(`[Klavis] Executing ${toolName} on Strata ${strataId}`);
        console.log(`[Klavis] Arguments:`, JSON.stringify(args, null, 2));

        const result = await executeKlavisToolLib(strataId, toolName, args) as any;
        
        console.log(`[Klavis] Result:`, JSON.stringify(result, null, 2));
        
        // Check for error in result
        if (result?.error) {
            return { success: false, error: result.error };
        }
        
        // Extract content from result
        if (result?.content?.[0]?.text) {
            return { success: true, result: result.content[0].text };
        }
        
        return { success: true, result: JSON.stringify(result) };

    } catch (e) {
        console.error(`[Klavis] Execution error:`, e);
        return { success: false, error: String(e) };
    }
}

export async function discoverKlavisToolsAction(strataId: string) {
    try {
        console.log(`[ServerAction] Discovering tools for Strata: ${strataId}`);
        const result = await listKlavisTools(strataId);
        // Ensure we return a plain object
        return { 
            success: true, 
            tools: result?.tools ? JSON.parse(JSON.stringify(result.tools)) : [] 
        };
    } catch (error: any) {
        console.error("[ServerAction] Discovery Error:", error);
        return { success: false, error: error.message, tools: [] };
    }
}

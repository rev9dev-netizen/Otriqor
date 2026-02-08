/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getKlavisClient } from "@/lib/klavis";
import { Integration } from "@/lib/integrations";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function fetchKlavisIntegrations(): Promise<Integration[]> {
    const client = getKlavisClient();
    try {
        const response = await client.mcpServer.getAllMcpServers();
        
        if (!response.servers) return [];

        return response.servers.map((server: any) => ({
            id: server.name.toLowerCase(), // Use name as ID for now (e.g. "gmail")
            name: server.name, // e.g. "Gmail"
            description: server.description || `Integration with ${server.name}`,
            longDescription: server.description || "No detailed description available.",
            // Heuristic for icon: try brandfetch or fallback
            // We return a string URL here. The UI handles string vs Component.
            icon: `https://cdn.brandfetch.io/${server.name.toLowerCase().replace(/\s+/g, '')}.com/w/400/h/400?c=1id05yjbcK2xcWSgXSu`,
            category: "productivity", // Default category
            isOfficial: true,
            author: "Klavis Hub",
            version: "1.0.0",
            tools: server.tools ? server.tools.map((t: any) => t.name) : []
        }));
    } catch (error) {
        console.error("Failed to fetch Klavis integrations:", error);
        return [];
    }
}

// Database actions for persistent MCP connections
/**
 * Helper to create Supabase client with proper cookie handling
 */
export async function getSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                },
            },
        }
    );
}

export async function saveIntegrationConnection(
    integrationName: string,
    strataId: string,
    metadata?: any
) {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
        .from("user_integrations")
        .upsert({
            user_id: user.id,
            integration_name: integrationName,
            strata_id: strataId,
            connected_at: new Date().toISOString(),
            last_used_at: new Date().toISOString(),
            metadata: metadata || {}
        }, {
            onConflict: "user_id,integration_name"
        })
        .select()
        .single();

    if (error) {
        console.error("[saveIntegrationConnection] Error:", error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

import { createClient } from "@supabase/supabase-js";

export async function getConnectedIntegrations(userId?: string) {
    let supabase;
    let currentUserId = userId;
    
    // If userId is explicitly provided, we assume this is a server-side privileged call
    if (userId) {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("[Integrations] Missing SUPABASE_SERVICE_ROLE_KEY. Cannot perform privileged action for " + userId);
            return { success: false, error: "Server Configuration Error: Missing Service Key", integrations: [] };
        }
        supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        // Use provided userId directly
        currentUserId = userId;
    } else {
        // Otherwise use standard user client (checking cookies)
        supabase = await getSupabase();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Not authenticated", integrations: [] };
        }
        currentUserId = user.id;
    }

    const { data, error } = await supabase
        .from("user_integrations")
        .select("*")
        .eq("user_id", currentUserId);

    if (userId) {
         const keySnippet = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5) + "..." : "MISSING";
         console.log(`[Integrations] Service Query for ${currentUserId} using Key (${keySnippet}): Found ${data?.length || 0} rows. Error: ${error?.message}`);
    }

    if (error) {
        console.error("[getConnectedIntegrations] Error:", error);
        return { success: false, error: error.message, integrations: [] };
    }

    return { success: true, integrations: data || [] };
}

export async function disconnectIntegration(integrationName: string) {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
        .from("user_integrations")
        .delete()
        .eq("user_id", user.id)
        .eq("integration_name", integrationName);

    if (error) {
        console.error("[disconnectIntegration] Error:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function updateIntegrationLastUsed(integrationName: string) {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false };

    await supabase
        .from("user_integrations")
        .update({ last_used_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("integration_name", integrationName);

    return { success: true };
}

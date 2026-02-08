/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createStrata } from "@/lib/klavis";

export type ConnectResult = 
    | { status: "connected"; message: string }
    | { status: "auth_required"; authUrl: string; message: string }
    | { status: "error"; message: string };

export async function connectIntegration(serverName: string): Promise<ConnectResult> {
    try {
        console.log(`[Connect] Attempting to connect ${serverName} for user user123...`);
        // We use 'user123' as the hardcoded demo user. In production, use auth().userId.
        // We pass the server name (e.g. 'GMAIL') to create/get the strata.
        // Note: createStrata returns the StrataGetResponse which contains oauthUrls.
        const response = await createStrata("user123", [serverName]);

        if (!response) {
            return { status: "error", message: "Failed to initialize integration." };
        }

        // Check for specific OAuth URL for this server
        // oauthUrls is a Record<string, string> mapping Integration ID -> URL
        // We need to match the serverName to the key in oauthUrls.
        const oauthUrls = (response as any).oauthUrls || {};
        
        // The key in oauthUrls might be the server name or ID. 
        // We try to find a matching key (case-insensitive)
        const authUrlKey = Object.keys(oauthUrls).find(k => k.toLowerCase().includes(serverName.toLowerCase()));
        
        if (authUrlKey && oauthUrls[authUrlKey]) {
            return { 
                status: "auth_required", 
                authUrl: oauthUrls[authUrlKey], 
                message: `Authentication required for ${serverName}` 
            };
        }

        return { status: "connected", message: `${serverName} is connected and ready.` };

    } catch (error) {
        console.error("Connection failed:", error);
        return { status: "error", message: "An unexpected error occurred." };
    }
}

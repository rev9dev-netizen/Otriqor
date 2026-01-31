import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url, options } = body;

        if (!url) {
            return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
        }

        // Validate URL protocol
        if (!url.startsWith("http")) {
             return NextResponse.json({ error: "Invalid URL protocol" }, { status: 400 });
        }

        console.log(`[Proxy] Forwarding request to: ${url}`);

        // Prepare headers: remove host-specific ones, keep authorization if passed in structure
        const headers = new Headers(options?.headers || {});
        // Explicitly remove host to avoid conflicts
        headers.delete("host");
        
        // Force no-store to ensure freshness as per previous requirements
        const fetchOptions: RequestInit = {
            ...options,
            headers,
            cache: "no-store"
        };

        const response = await fetch(url, fetchOptions);
        
        // Handle non-text responses (like images) if needed, but for search APIs usually JSON/Text
        // We'll try to parse as text first to avoid buffering issues
        const responseText = await response.text();

        // Try parsing JSON to return proper JSON response if applicable
        let responseData = responseText;
        let contentType = "text/plain";

        try {
            responseData = JSON.parse(responseText);
            contentType = "application/json";
        } catch {
            // Not JSON, keep as text
        }

        return NextResponse.json(responseData, { 
            status: response.status,
            headers: {
                "Content-Type": contentType
            }
        });

    } catch (error) {
        console.error("[Proxy] Error:", error);
        return NextResponse.json({ 
            error: "Proxy request failed",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Helper to make fetch requests that bypass CORS by routing through the Next.js API Proxy.
 * 
 * @param url The target external URL
 * @param options Standard Fetch options
 * @returns Promise<Response-like>
 */
export async function fetchViaProxy(url: string, options: RequestInit = {}): Promise<any> {
    const isServer = typeof window === 'undefined';

    // If on server, direct fetch (no CORS issues)
    if (isServer) {
        return fetch(url, { ...options, cache: 'no-store' });
    }

    // If on client, route through proxy
    try {
        const res = await fetch('/api/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url,
                options
            }),
            cache: 'no-store'
        });

        // The proxy returns the actual data directly as JSON (or text)
        // We wrap it to mimic a Response object so existing code using .json() still works
        // BUT, our proxy returns the *parsed* body in the JSON response logic.
        // Let's check status.
        
        if (!res.ok) {
            throw new Error(`Proxy error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        
        // Return a mock Response object to maintain compatibility with existing code
        // that might expect result.json() or result.text()
        return {
            ok: true,
            status: res.status,
            statusText: res.statusText,
            json: async () => data,
            text: async () => typeof data === 'string' ? data : JSON.stringify(data)
        };

    } catch (e) {
        console.error("FetchViaProxy Failed:", e);
        throw e;
    }
}

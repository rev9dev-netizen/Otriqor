/* eslint-disable @typescript-eslint/no-explicit-any */
// Client-side Proxy to allow usage in Browser/Edge
export async function getStockData(query: string, range: string = "1d", interval: string = "1d") {
    const res = await fetch(`/api/stock?q=${encodeURIComponent(query)}&range=${range}&interval=${interval}`);
    if (!res.ok) {
        let errorMessage = res.statusText;
        try {
            const errorBody = await res.json();
            if (errorBody.error) errorMessage = errorBody.error;
        } catch { } // Ignore JSON parse error
        throw new Error(`Failed to fetch stock: ${errorMessage}`);
    }
    return res.json();
}

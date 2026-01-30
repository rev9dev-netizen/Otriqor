/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source?: string;
  date?: string;
  imageUrl?: string;
}

// Simplified to call local proxy
export async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(query)}`);

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Web Search Proxy Failed: ${response.status}`, errorText);
        throw new Error(`Web Search failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // Transform SerpApi response (Proxy returns exact SerpApi JSON)
    if (data.organic_results) {
        return data.organic_results.map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            source: item.source || new URL(item.link).hostname,
            date: item.date,
            imageUrl: item.thumbnail 
        }));
    }
    
    return [];

  } catch (error) {
    console.error("Web Search Error:", error);
    return [];
  }
}

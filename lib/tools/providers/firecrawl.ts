/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchViaProxy } from "@/lib/utils/proxy-client";
import { SearchResult } from "../web-search";

const FIRECRAWL_API_KEY = "fc-ed83bfc2ae504d94be9e8e0798462f26";

export async function searchFirecrawl(query: string): Promise<SearchResult[]> {
  try {
    const response = await fetchViaProxy("https://api.firecrawl.dev/v0/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: query,
        pageOptions: { fetchPageContent: false },
        limit: 10
      })
    });

    if (!response.ok) {
        throw new Error(`Firecrawl Failed: ${response.status}`);
    }

    const json = await response.json();
    // Structure: { success: true, data: [ { title, url, description, metadata } ] }

    if (!json.success || !json.data) return [];

    return json.data.map((item: any) => ({
      title: item.title,
      link: item.url,
      snippet: item.description || item.metadata?.description || "",
      source: new URL(item.url).hostname,
      imageUrl: item.metadata?.ogImage // Firecrawl often returns ogImage
    }));

  } catch (e) {
    console.error("Firecrawl Search Error", e);
    return [];
  }
}

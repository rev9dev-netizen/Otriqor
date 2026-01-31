/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchViaProxy } from "@/lib/utils/proxy-client";
import { SearchResult } from "../web-search";

const JINA_API_KEY = "jina_04cc319c708c41b3b51ae9b5c10aa749cDdkQDoId6Rvgot5pHZtrUcGi5Qf";

export async function searchJina(query: string): Promise<SearchResult[]> {
  try {
    const response = await fetchViaProxy(`https://s.jina.ai/${encodeURIComponent(query)}`, {
      headers: {
        "Authorization": `Bearer ${JINA_API_KEY}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
        throw new Error(`Jina Failed: ${response.status}`);
    }

    const json = await response.json();
    
    // Jina Search returns a list directly or inside 'data'? 
    // Docs say: standard response is stream of objects or list.
    // Let's assume standard list or check structure.
    // Structure: { data: [ { title, url, description, content } ] }
    
    const items = json.data || [];
    return items.map((item: any) => ({
      title: item.title,
      link: item.url,
      snippet: item.description || item.content?.slice(0, 200) || "",
      source: new URL(item.url).hostname,
      imageUrl: item.image // Check if Jina returns images
    }));

  } catch (e) {
    console.error("Jina Search Error", e);
    return [];
  }
}

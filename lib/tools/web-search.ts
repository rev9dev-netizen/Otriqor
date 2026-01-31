/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { searchJina } from "./providers/jina";
import { searchFirecrawl } from "./providers/firecrawl";
import { fetchSerpApi } from "./providers/serp";

// Types
export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source?: string;
  date?: string;
  imageUrl?: string;
}

// SerpApi (Fallback)
async function searchSerpApi(query: string): Promise<SearchResult[]> {
    try {
        console.log(`[SerpApi] Searching Direct: ${query}`);
        const data = await fetchSerpApi({
            q: query,
            engine: "google",
            num: "10"
        });

        return data.organic_results?.map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet,
            source: item.source || new URL(item.link).hostname,
            date: item.date,
            imageUrl: item.thumbnail
        })) || [];
    } catch (e) {
        console.error("SerpApi Error", e);
        return [];
    }
}

// Aggregator
// Google Images (Dedicated for reliable gallery)
async function searchGoogleImages(query: string): Promise<SearchResult[]> {
    try {
        console.log(`[GoogleImages] Searching Direct: ${query}`);
        const data = await fetchSerpApi({
            q: query,
             engine: "google_images",
             num: "10"
        });
        
        return data.images_results?.map((item: any) => ({
            title: item.title,
            link: item.link, // Link to context page
            snippet: item.snippet || item.title,
            source: item.source,
            // Use 'original' for quality, wrapped in proxy to bypass 403s.
            // Add fallback thumbnail in case original is strictly blocked.
            imageUrl: `/api/proxy-image?url=${encodeURIComponent(item.original)}&fallback=${encodeURIComponent(item.thumbnail)}`
        })) || [];
    } catch (e) {
        console.error("SerpApi Images Error", e);
        return [];
    }
}

// Aggregator
export async function searchWeb(query: string): Promise<SearchResult[]> {
  const primaryProviders = [
      { name: "Jina", fn: searchJina },
      { name: "Firecrawl", fn: searchFirecrawl }
  ];

  console.log(`Starting Web Search for: "${query}"`);

  // 1. Run Primary (Text), Fallback (Organic), AND Dedicated Images in parallel
  const [primaryResult, serpApiResult] = await Promise.allSettled([
      (async () => {
          for (const provider of primaryProviders) {
              try {
                  console.log(`Trying Primary Provider: ${provider.name}...`);
                  const res = await provider.fn(query);
                  if (res && res.length > 0) return res;
              } catch (e) {
                  console.error(`❌ ${provider.name} Failed.`);
              }
          }
          return [];
      })(),
      searchSerpApi(query),
      // searchGoogleImages(query) // DISABLED: User requested to disable images for now
  ]);

  const primaryItems = primaryResult.status === 'fulfilled' ? primaryResult.value : [];
  const serpItems = serpApiResult.status === 'fulfilled' ? serpApiResult.value : [];
//   const imageItems = imagesResult.status === 'fulfilled' ? imagesResult.value : [];

  // 2. Merge Strategies
  const mergedMap = new Map<string, SearchResult>();

  // ... (Helper functions remain) ...
  const norm = (url: string) => {
      try {
          const u = new URL(url);
          return u.hostname + u.pathname;
      } catch { return url; }
  };

   // Helper to validate Image URL (Must be absolute http/https)
   const isValidImage = (url?: string) => {
       return url && (url.startsWith('http://') || url.startsWith('https://'));
   };

  // A. Add Primary Items (Text Priority)
  primaryItems.forEach(item => {
      // Validate Jina's images. If relative/invalid, strip them.
      if (!isValidImage(item.imageUrl)) item.imageUrl = undefined;
      mergedMap.set(norm(item.link), item);
  });

  // B. Add Organic Items (Backfill)
  serpItems.forEach(item => {
      if (!isValidImage(item.imageUrl)) item.imageUrl = undefined;
      
      const key = norm(item.link);
      if (mergedMap.has(key)) {
          const existing = mergedMap.get(key)!;
          if (!existing.imageUrl && item.imageUrl) {
               existing.imageUrl = item.imageUrl; 
          }
      } else {
          mergedMap.set(key, item);
      }
  });

  /* DISABLED: Image Injection
  // C. Inject Dedicated Images (Visual Priority)
  imageItems.forEach(imgItem => {
      if (!isValidImage(imgItem.imageUrl)) return;

      const key = norm(imgItem.link);
      if (mergedMap.has(key)) {
          const existing = mergedMap.get(key)!;
          if (!existing.imageUrl) {
               existing.imageUrl = imgItem.imageUrl;
          }
      } else {
          mergedMap.set(key, imgItem);
      }
  });
  */

  const finalResults = Array.from(mergedMap.values());
  console.log(`Merged Total: ${finalResults.length} results`);

  // Universal Proxy: Ensure ALL images bypass hotlink protection
  return finalResults.slice(0, 20).map(item => {
      if (item.imageUrl && !item.imageUrl.startsWith('/api/proxy')) {
           // Skip proxying if it's already a safe data/blob or reliable CDN (e.g. SerpApi thumbnails)
           // But for consistency and "Manual View" simulation, we proxy everything except already proxied.
           if (item.imageUrl.includes('serpapi.com')) return item; // Optimization: SerpApi thumbs are safe

           item.imageUrl = `/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}`;
      }
      return item;
  });
}

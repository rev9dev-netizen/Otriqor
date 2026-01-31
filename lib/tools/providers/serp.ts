import { fetchViaProxy } from "@/lib/utils/proxy-client";

const SERPAPI_KEY = "a51e6a4f1c9e4c286934ef3d33bfd6dec6bb855f519435bd994239a53f28d08f";

interface SerpOptions {
  q: string;
  engine?: string;
  num?: string;
}

export async function fetchSerpApi(options: SerpOptions) {
  try {
    const params = new URLSearchParams({
      api_key: SERPAPI_KEY,
      engine: options.engine || "google",
      q: options.q,
      num: options.num || "10",
      output: "json"
    });

    const response = await fetchViaProxy(`https://serpapi.com/search?${params.toString()}`, {
       headers: {
           // Mimic standard browser to avoid blocks
           "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
       },
       cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SerpApi Direct Fetch Failed: ${response.status} - ${errorText}`);
      throw new Error(`SerpApi Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SerpApi Provider Error:", error);
    throw error;
  }
}

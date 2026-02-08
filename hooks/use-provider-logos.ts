import { useState, useEffect } from "react";

interface LogoEntry {
  filename: string;
  path: string;
  key: string; // extracted from filename
}

export function useProviderLogos() {
  const [logoMap, setLogoMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLogos() {
      try {
        const res = await fetch("/api/ui/logos");
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, string> = {};
          
          data.logos.forEach((logo: LogoEntry) => {
             // Map "deepseek" -> path
             map[logo.key] = logo.path; 
             
             // Also support full exact match if needed
             map[logo.filename] = logo.path;
             
             // Handle "provider-color" convention explicitly
             if (logo.key.endsWith("-color")) {
                 map[logo.key.replace("-color", "")] = logo.path;
             }
          });
          
          setLogoMap(map);
        }
      } catch (e) {
        console.error("Failed to fetch dynamic logos", e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLogos();
  }, []);

  const getLogo = (providerId: string, fallbackUrl: string) => {
      if (isLoading) return fallbackUrl;
      const normalizedId = providerId.toLowerCase();
      
      // Try exact match
      if (logoMap[normalizedId]) return logoMap[normalizedId];
      
      // Try with -color suffix logic handled in map, but maybe reverse?
      // No, we stripped -color in map construction.
      
      // Manual overrides for known deviations if needed (e.g. "anthropic" vs "claude")
      if (normalizedId === 'anthropic' && logoMap['claude']) return logoMap['claude'];
      if (normalizedId === 'zhipu' && logoMap['zai']) return logoMap['zai'];

      return fallbackUrl;
  };

  return { getLogo, isLoading };
}

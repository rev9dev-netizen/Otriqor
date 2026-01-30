import { NextResponse } from "next/server";
import { models as staticModels, Model } from "@/lib/config/models";
import { Mistral } from "@mistralai/mistralai";
import { Sparkles } from "lucide-react";

export async function GET() {
  const models: Model[] = [...staticModels];

  // 1. Fetch Mistral Models dynamically
  try {
      const apiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY;
      if (apiKey) {
          const client = new Mistral({ apiKey });
          const response = await client.models.list(); 
          
          if (response && response.data) {
              const mistralModels = response.data
                  .filter((m: { id: string }) => !m.id.includes('embed')) 
                  .map((m: { id: string }) => ({
                      id: m.id,
                      name: m.id.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '), 
                      description: `Mistral ${m.id} model`,
                      maxTokens: 32000, 
                      icon: Sparkles, 
                      provider: "mistral" as const,
                      capabilities: {
                          vision: false, 
                          thinking: m.id.includes('large'), // Heuristic
                          webSearch: false,
                          functionCall: true
                      }
                  }));
              
              // Remove static mistral items
              const nonMistral = models.filter(m => m.provider !== 'mistral');
              return NextResponse.json({ models: [...nonMistral, ...mistralModels] });
          }
      }
  } catch (e) {
      console.error("Failed to fetch Mistral models:", e);
      // Fallback to static if error
  }

  return NextResponse.json({ models });
}

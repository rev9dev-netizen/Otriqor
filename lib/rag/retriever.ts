/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";
import { generateEmbeddings } from "@/lib/rag/embeddings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

export interface RetrievalResult {
    content: string;
    similarity: number;
    file_id: string;
}

export async function retrieveContext(query: string, fileIds: string[]): Promise<string> {
  if (!query || fileIds.length === 0) return "";

  try {
      // 1. Generate Query Embedding
      const embedding = (await generateEmbeddings([query]))[0];
      if (!embedding) return "";

      // 2. Search in Vector DB (using RPC)
      // Call the 'match_documents' function we created in SQL
      const { data: chunks, error } = await supabase.rpc("match_documents", {
          query_embedding: embedding,
          match_threshold: 0.5, // Similarity threshold
          match_count: 5,       // Top 5 chunks
          filter_file_ids: fileIds
      });

      if (error) {
          console.error("Retrieval Error:", error);
          return "";
      }

      if (!chunks || chunks.length === 0) {
          return "";
      }

      // 3. Format Context
      // "File [ID]: <content>..."
      const context = chunks.map((chunk: any) => 
          `[Context from file ${chunk.file_id}]:\n${chunk.content}`
      ).join("\n\n");

      return context;

  } catch (e) {
      console.error("Retrieval Exception:", e);
      return "";
  }
}

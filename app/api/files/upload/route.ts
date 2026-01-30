/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseFile } from "@/lib/rag/parser";
import { chunkText } from "@/lib/rag/chunker";
import { generateEmbeddings } from "@/lib/rag/embeddings";

// Backend Supabase Client (Service Role for Storage/DB writes)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string; // Optional: Enforce auth if needed

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Upload to Supabase Storage
    const path = `${userId || "anonymous"}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("files") // Ensure this bucket exists!
      .upload(path, file);

    if (uploadError) {
      console.error("Storage Error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // 2. Parse File Content through naive parser
    let textContent = "";
    try {
        textContent = await parseFile(file);
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Parsing failed" }, { status: 400 });
    }

    // 3. Create File Record in DB
    const { data: fileRecord, error: dbError } = await supabase
      .from("files")
      .insert({
        name: file.name,
        type: file.type,
        size: file.size,
        path: path,
        user_id: userId || null
      })
      .select()
      .single();

    if (dbError || !fileRecord) {
        console.error("DB Error:", dbError);
        return NextResponse.json({ error: "Database record creation failed" }, { status: 500 });
    }

    // 4. Chunk & Embed
    const chunks = chunkText(textContent);
    
    if (chunks.length > 0) {
        const embeddings = await generateEmbeddings(chunks);
        
        const sections = chunks.map((chunk, i) => ({
            file_id: fileRecord.id,
            content: chunk,
            embedding: embeddings[i],
            token_count: Math.ceil(chunk.length / 4) // Crude estimation
        }));

        const { error: vectorError } = await supabase
            .from("document_sections")
            .insert(sections);

        if (vectorError) {
             console.error("Vector Store Error:", vectorError);
             // We don't fail the whole request, but warn. 
             // Ideally we might want transactional integrity here.
        }
    }

    return NextResponse.json({ 
        success: true, 
        file: {
            id: fileRecord.id,
            name: fileRecord.name,
            type: fileRecord.type
        } 
    });

  } catch (error: any) {
    console.error("Upload Handler Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

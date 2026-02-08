import { NextRequest, NextResponse } from "next/server";
import { modelRouter } from "@/lib/api/router";
import { MessageNode } from "@/lib/store/chat-store";

export async function POST(req: NextRequest) {
    try {
        const { messages, modelId } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
        }

        // Generate Title using Router (which uses Provider-Specific Logic)
        const title = await modelRouter.generateTitle(modelId || "gpt-4o-mini", messages);

        return NextResponse.json({ title });
    } catch (e: any) {
        console.error("[TitleAPI] Error:", e);
        return NextResponse.json({ error: e.message || "Failed to generate title" }, { status: 500 });
    }
}

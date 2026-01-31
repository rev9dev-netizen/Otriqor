import { NextResponse } from "next/server";
import { fetchAllModels } from "@/lib/api/model-service";

export async function GET() {
  const models = await fetchAllModels();
  return NextResponse.json({ models });
}

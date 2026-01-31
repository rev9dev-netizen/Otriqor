import { NextResponse } from 'next/server';

export async function GET() {
  const providers = {
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    mistral: !!process.env.NEXT_PUBLIC_MISTRAL_API_KEY || !!process.env.MISTRAL_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    deepseek: !!process.env.DEEPSEEK_API_KEY,
  };

  return NextResponse.json({ providers });
}

import { NextResponse } from 'next/server';

export async function GET() {
  const providers = {
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    mistral: !!process.env.MISTRAL_API_KEY || !!process.env.MISTRAL_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    deepseek: !!process.env.DEEPSEEK_API_KEY || true, // Test mode
    zhipu: !!process.env.ZHIPU_API_KEY || !!process.env.NEXT_PUBLIC_ZHIPU_API_KEY || true, 
    huggingface: !!process.env.HUGGINGFACE_API_KEY || true, // Test mode
  };

  return NextResponse.json({ providers });
}

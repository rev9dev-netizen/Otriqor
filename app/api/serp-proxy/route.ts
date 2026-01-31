import { NextRequest, NextResponse } from 'next/server';

const SERPAPI_KEY = "a51e6a4f1c9e4c286934ef3d33bfd6dec6bb855f519435bd994239a53f28d08f";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const engine = searchParams.get('engine') || 'google';
  const num = searchParams.get('num') || '10';

  if (!q) {
    return new NextResponse('Missing query', { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      api_key: SERPAPI_KEY,
      engine,
      q,
      num,
      output: 'json'
    });

    // Use standard endpoint
    const response = await fetch(`https://serpapi.com/search?${params.toString()}`, {
       headers: {
           // Mimic standard browser to avoid blocks
           "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
       }
    });

    if (!response.ok) {
      console.error(`SerpApi Proxy Failed: ${response.status} ${response.statusText}`);
      return new NextResponse(`SerpApi Error: ${response.statusText}`, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('SerpApi Proxy Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

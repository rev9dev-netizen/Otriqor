export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

const SERPAPI_KEY = "a51e6a4f1c9e4c286934ef3d33bfd6dec6bb855f519435bd994239a53f28d08f";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const serpParams = new URLSearchParams({
    engine: "google",
    q: q,
    api_key: SERPAPI_KEY,
    num: "5"
  });

  try {
    const response = await fetch(`https://serpapi.com/search.json?${serpParams.toString()}`);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`SerpApi Proxy Error: ${response.status} ${errorText}`);
        return NextResponse.json({ error: `SerpApi failed: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
      console.error("SerpApi Proxy Exception:", error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

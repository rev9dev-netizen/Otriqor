import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  const fallbackUrl = searchParams.get('fallback');

  if (!imageUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  // Helper to fetch an image
  async function fetchImage(url: string, referrer?: string) {
      if (!url) throw new Error("No URL");
      const res = await fetch(url, {
          headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
              'Referer': referrer || new URL(url).origin,
              'Sec-Fetch-Dest': 'image',
              'Sec-Fetch-Mode': 'no-cors'
          }
      });
      if (!res.ok) throw new Error(res.statusText);
      
      // Strict Validation: If it returns 200 OK but is HTML/XML (Error Page), treat as failure.
      const cType = res.headers.get('content-type') || '';
      if (!cType.startsWith('image/') && !cType.startsWith('binary/')) {
          throw new Error(`Invalid content-type: ${cType}`);
      }
      
      return res;
  }

  try {
    let response;
    try {
        // Try Original
        response = await fetchImage(imageUrl);
    } catch(e) {
        console.warn(`Proxy: Primary failed for ${imageUrl}, trying fallback.`);
        if (fallbackUrl) {
             response = await fetchImage(fallbackUrl);
        } else {
            throw e;
        }
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image Proxy Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

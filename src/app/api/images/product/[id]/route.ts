import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * High-performance image delivery endpoint with CDN caching headers.
 * Converts raw Base64 data stored in the database into binary image streams
 * that are cached by Vercel Edge CDN (0 Fast Origin Transfer on cache hits)
 * and by browser memory/disk cache.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id) || id <= 0) {
    return new NextResponse('Invalid image ID', { status: 400 });
  }

  const record = await prisma.productImage.findUnique({
    where: { id },
    select: { url: true },
  });

  if (!record || !record.url) {
    return new NextResponse('Image not found', { status: 404 });
  }

  // Handle Base64 Data URLs
  if (record.url.startsWith('data:image/')) {
    const match = /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/.exec(record.url);
    if (!match) {
      return new NextResponse('Corrupted image data', { status: 500 });
    }

    const contentType = match[1];
    const imageBuffer = Buffer.from(match[2], 'base64');

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(imageBuffer.length),
        // Cache at Vercel Edge CDN for 7 days, browser disk for 7 days
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  // Handle standard relative or external URLs
  if (record.url.startsWith('/') || record.url.startsWith('http')) {
    return NextResponse.redirect(record.url, 307);
  }

  return new NextResponse('Unsupported image format', { status: 500 });
}

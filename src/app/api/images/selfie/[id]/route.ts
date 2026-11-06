import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * On-demand customer selfie delivery endpoint.
 * Prevents embedding multi-megabyte base64 selfie strings directly into
 * the Dashboard and Orders SSR HTML payloads.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id) || id <= 0) {
    return new NextResponse('Invalid transaction ID', { status: 400 });
  }

  const trx = await prisma.transaction.findUnique({
    where: { id },
    select: { selfieUrl: true },
  });

  if (!trx || !trx.selfieUrl) {
    return new NextResponse('Selfie not found', { status: 404 });
  }

  if (trx.selfieUrl.startsWith('data:image/')) {
    const match = /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/.exec(trx.selfieUrl);
    if (!match) {
      return new NextResponse('Corrupted selfie data', { status: 500 });
    }

    const contentType = match[1];
    const imageBuffer = Buffer.from(match[2], 'base64');

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(imageBuffer.length),
        'Cache-Control': 'private, max-age=86400, stale-while-revalidate=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  if (trx.selfieUrl.startsWith('/') || trx.selfieUrl.startsWith('http')) {
    return NextResponse.redirect(trx.selfieUrl, 307);
  }

  return new NextResponse('Unsupported selfie format', { status: 500 });
}

import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key?: string[] }> }
): Promise<Response> {
  const { key } = await params;
  if (!key || key.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Attachment key is required.' } }, { status: 404 });
  }

  const rawPath = key.map(encodeURIComponent).join('/');
  const apiUrl = process.env.API_URL ?? 'http://localhost:3000';

  try {
    const backendRes = await fetch(`${apiUrl}/attachments/raw/${rawPath}`, {
      headers: { cookie: request.headers.get('cookie') ?? '' },
      cache: 'no-store',
    });

    if (!backendRes.ok) {
      const directPath = key.join('/');
      const retryRes = await fetch(`${apiUrl}/attachments/raw/${directPath}`, {
        headers: { cookie: request.headers.get('cookie') ?? '' },
        cache: 'no-store',
      });
      if (retryRes.ok) {
        return new Response(retryRes.body, {
          status: 200,
          headers: {
            'content-type': retryRes.headers.get('content-type') || 'application/octet-stream',
            'cache-control': 'public, max-age=86400',
          },
        });
      }
      return NextResponse.json({ error: { code: 'ATTACHMENT_NOT_FOUND', message: 'Attachment not found.' } }, { status: 404 });
    }

    return new Response(backendRes.body, {
      status: 200,
      headers: {
        'content-type': backendRes.headers.get('content-type') || 'application/octet-stream',
        'cache-control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: { code: 'NETWORK_ERROR', message: 'Unable to reach backend service.' } }, { status: 502 });
  }
}

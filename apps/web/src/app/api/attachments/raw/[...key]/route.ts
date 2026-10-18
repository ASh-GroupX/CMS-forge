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

    const res = backendRes.ok ? backendRes : null;
    if (!res) {
      const directPath = key.join('/');
      const retryRes = await fetch(`${apiUrl}/attachments/raw/${directPath}`, {
        headers: { cookie: request.headers.get('cookie') ?? '' },
        cache: 'no-store',
      });
      if (retryRes.ok) {
        return new Response(retryRes.body, {
          status: 200,
          headers: buildHeaders(retryRes, key),
        });
      }
      return NextResponse.json({ error: { code: 'ATTACHMENT_NOT_FOUND', message: 'Attachment not found.' } }, { status: 404 });
    }

    return new Response(backendRes.body, {
      status: 200,
      headers: buildHeaders(backendRes, key),
    });
  } catch {
    return NextResponse.json({ error: { code: 'NETWORK_ERROR', message: 'Unable to reach backend service.' } }, { status: 502 });
  }
}

function buildHeaders(res: Response, key: string[]): Headers {
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const disposition = res.headers.get('content-disposition');
  const headers = new Headers();
  headers.set('content-type', contentType);
  headers.set('cache-control', 'public, max-age=86400');
  if (disposition) {
    headers.set('content-disposition', disposition);
  } else {
    let filename = key[key.length - 1] || 'attachment.jpg';
    if (!filename.includes('.')) filename += '.jpg';
    headers.set('content-disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  }
  return headers;
}

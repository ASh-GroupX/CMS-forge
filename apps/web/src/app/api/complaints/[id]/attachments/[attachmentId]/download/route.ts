import { NextResponse } from 'next/server';

type RouteParams = { attachmentId?: string; id?: string };

export async function GET(request: Request, { params }: { params: Promise<RouteParams> }): Promise<Response> {
  const { attachmentId, id } = await params;
  if (!id?.trim() || !attachmentId?.trim()) return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Missing attachment target.', correlationId: null } }, { status: 400 });

  try {
    const shouldRedirect = new URL(request.url).searchParams.get('redirect') === '1';
    const response = await fetch(new URL(`/complaints/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}/download`, process.env.API_URL ?? 'http://localhost:3000'), {
      cache: 'no-store',
      headers: new Headers({ Accept: 'application/json', cookie: request.headers.get('cookie') ?? '' }),
      method: 'GET',
    });
    const body = await response.arrayBuffer();
    if (shouldRedirect && response.ok) return redirectDownload(body);
    return new Response(body, { headers: jsonHeaders(response.headers), status: response.status });
  } catch {
    return NextResponse.json({ error: { code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } }, { status: 502 });
  }
}

function redirectDownload(body: ArrayBuffer): Response {
  const token = downloadToken(body);
  if (token && isHttpUrl(token)) {
    const response = NextResponse.redirect(token);
    response.headers.set('cache-control', 'no-store');
    return response;
  }
  return NextResponse.json({ error: { code: 'ATTACHMENT_DOWNLOAD_TARGET_UNAVAILABLE', message: 'Download target is unavailable in this environment.', correlationId: null } }, { headers: { 'cache-control': 'no-store' }, status: 409 });
}

function downloadToken(body: ArrayBuffer): string | null {
  const payload = JSON.parse(new TextDecoder().decode(body)) as { download?: { token?: unknown } };
  return typeof payload.download?.token === 'string' ? payload.download.token.trim() : null;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function jsonHeaders(headers: Headers): Headers {
  return new Headers({ 'cache-control': 'no-store', 'content-type': headers.get('content-type') ?? 'application/json' });
}

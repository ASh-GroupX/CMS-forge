import { NextResponse } from 'next/server';

type RouteParams = { attachmentId?: string; id?: string };

export async function GET(request: Request, { params }: { params: Promise<RouteParams> }): Promise<Response> {
  const { attachmentId, id } = await params;
  if (!id?.trim() || !attachmentId?.trim()) {
    return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Missing attachment target.', correlationId: null } }, { status: 400 });
  }

  try {
    const accept = request.headers.get('accept') ?? '';
    const searchParams = new URL(request.url).searchParams;
    const shouldRedirect = searchParams.get('redirect') === '1' || searchParams.get('download') === '1' || accept.includes('text/html');

    const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
    const response = await fetch(new URL(`/complaints/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}/download`, apiUrl), {
      cache: 'no-store',
      headers: new Headers({ Accept: 'application/json', cookie: request.headers.get('cookie') ?? '' }),
      method: 'GET',
    });

    const body = await response.arrayBuffer();
    if (!shouldRedirect || !response.ok) {
      return new Response(body, { headers: jsonHeaders(response.headers), status: response.status });
    }

    const token = downloadToken(body);
    if (token && (isHttpUrl(token) || token.startsWith('/'))) {
      if (isHttpUrl(token)) {
        const res = NextResponse.redirect(token, 307);
        res.headers.set('cache-control', 'no-store');
        return res;
      }

      // Stream the raw file directly without exposing tokens or redirects
      try {
        const rawPath = token.startsWith('/api/') ? token.slice(4) : token;
        const rawRes = await fetch(new URL(rawPath, apiUrl), {
          cache: 'no-store',
          headers: new Headers({ cookie: request.headers.get('cookie') ?? '' }),
        });
        if (rawRes.ok) {
          const rawBuffer = await rawRes.arrayBuffer();
          const contentType = rawRes.headers.get('content-type') || 'application/octet-stream';
          const disposition = rawRes.headers.get('content-disposition') || `attachment; filename="attachment-${attachmentId}"`;
          return new Response(rawBuffer, {
            status: 200,
            headers: {
              'content-type': contentType,
              'content-disposition': disposition,
              'cache-control': 'no-store',
            },
          });
        }
      } catch {}

      return redirectDownload(body, request.url);
    }

    return redirectDownload(body, request.url);
  } catch {
    return NextResponse.json({ error: { code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } }, { status: 502 });
  }
}

function redirectDownload(body: ArrayBuffer, requestUrl: string): Response {
  const token = downloadToken(body);
  if (token && (isHttpUrl(token) || token.startsWith('/'))) {
    const target = isHttpUrl(token) ? token : new URL(token, requestUrl).toString();
    const response = NextResponse.redirect(target, 307);
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

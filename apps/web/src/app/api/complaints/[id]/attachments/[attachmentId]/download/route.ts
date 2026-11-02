import { NextResponse } from 'next/server';

type RouteParams = { attachmentId?: string; id?: string };

export async function GET(request: Request, { params }: { params: Promise<RouteParams> }): Promise<Response> {
  const { attachmentId, id } = await params;
  if (!id?.trim() || !attachmentId?.trim()) {
    return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Missing attachment target.', correlationId: null } }, { headers: { 'cache-control': 'no-store' }, status: 400 });
  }

  try {
    const accept = request.headers.get('accept') ?? '';
    const searchParams = new URL(request.url).searchParams;
    const shouldRedirect = searchParams.get('redirect') === '1' || searchParams.get('download') === '1' || accept.includes('text/html');

    const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
    const response = await fetch(new URL(`/complaints/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}/download${shouldRedirect ? '?download=1' : ''}`, apiUrl), {
      cache: 'no-store',
      headers: new Headers({ Accept: shouldRedirect ? '*/*' : 'application/json', cookie: request.headers.get('cookie') ?? '' }),
      method: 'GET',
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && !contentType.includes('application/json')) return fileResponse(response, attachmentId);
    if (!shouldRedirect || !response.ok) {
      return new Response(response.body, { headers: jsonHeaders(response.headers), status: response.status });
    }

    const token = downloadToken(await response.arrayBuffer());
    const rawPath = token?.startsWith('/api/attachments/raw/') ? token.slice(4)
      : token?.startsWith('/attachments/raw/') ? token : null;
    if (!rawPath && !token?.startsWith('https://')) return unavailable();

    try {
      const target = rawPath ? new URL(rawPath, apiUrl) : token!;
      const file = await fetch(target, rawPath ? {
        cache: 'no-store',
        headers: { cookie: request.headers.get('cookie') ?? '' },
      } : { cache: 'no-store' });
      if (file.ok && !(file.headers.get('content-type') ?? '').includes('application/json')) {
        return fileResponse(file, attachmentId);
      }
    } catch { /* The token target is unavailable. */ }
    return unavailable();
  } catch {
    return NextResponse.json({ error: { code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } }, { headers: { 'cache-control': 'no-store' }, status: 502 });
  }
}

function unavailable(): Response {
  return NextResponse.json({ error: { code: 'ATTACHMENT_DOWNLOAD_TARGET_UNAVAILABLE', message: 'Download target is unavailable in this environment.', correlationId: null } }, { headers: { 'cache-control': 'no-store' }, status: 409 });
}

function downloadToken(body: ArrayBuffer): string | null {
  const payload = JSON.parse(new TextDecoder().decode(body)) as { download?: { token?: unknown } };
  return typeof payload.download?.token === 'string' ? payload.download.token.trim() : null;
}

function fileResponse(source: Response, attachmentId: string): Response {
  return new Response(source.body, {
    status: 200,
    headers: {
      'content-type': source.headers.get('content-type') || 'application/octet-stream',
      'content-disposition': source.headers.get('content-disposition') || `attachment; filename="attachment-${attachmentId}"`,
      'cache-control': 'no-store',
    },
  });
}

function jsonHeaders(headers: Headers): Headers {
  return new Headers({ 'cache-control': 'no-store', 'content-type': headers.get('content-type') ?? 'application/json' });
}

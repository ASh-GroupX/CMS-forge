import { NextResponse } from 'next/server';

type RouteParams = { attachmentId?: string; id?: string };

export async function GET(request: Request, { params }: { params: Promise<RouteParams> }): Promise<Response> {
  const { attachmentId, id } = await params;
  if (!id?.trim() || !attachmentId?.trim()) return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Missing attachment target.', correlationId: null } }, { status: 400 });

  try {
    const shouldRedirect = new URL(request.url).searchParams.get('redirect') === '1';
    const response = await fetch(new URL(`/internal-tickets/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}/download`, process.env.API_URL ?? 'http://localhost:3000'), {
      cache: 'no-store',
      headers: new Headers({ Accept: 'application/json', cookie: request.headers.get('cookie') ?? '' }),
      method: 'GET',
    });
    
    if (shouldRedirect && response.ok) {
      const data = await response.json();
      const token = data.url;
      if (token && typeof token === 'string' && (token.startsWith('http://') || token.startsWith('https://') || token.startsWith('/'))) {
        const target = token.startsWith('/') ? new URL(token, request.url).toString() : token;
        const redirectRes = NextResponse.redirect(target);
        redirectRes.headers.set('cache-control', 'no-store');
        return redirectRes;
      }
      if (token && typeof token === 'string' && token.startsWith('attdl_')) {
        return new Response(
          "Download is not supported in the local memory driver environment. Please configure S3 in your .env file to enable actual file downloads.", 
          { status: 400, headers: { 'content-type': 'text/plain' } }
        );
      }
      return NextResponse.json({ error: { code: 'ATTACHMENT_DOWNLOAD_TARGET_UNAVAILABLE', message: 'Download target is unavailable.', correlationId: null } }, { status: 409 });
    }
    
    const body = await response.arrayBuffer();
    return new Response(body, { headers: new Headers({ 'content-type': 'application/json' }), status: response.status });
  } catch {
    return NextResponse.json({ error: { code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } }, { status: 502 });
  }
}

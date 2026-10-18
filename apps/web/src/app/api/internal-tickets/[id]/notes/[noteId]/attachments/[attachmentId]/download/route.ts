import { NextResponse } from 'next/server';

type RouteParams = { attachmentId?: string; id?: string; noteId?: string };

export async function GET(request: Request, { params }: { params: Promise<RouteParams> }): Promise<Response> {
  const { attachmentId, id, noteId } = await params;
  if (!id?.trim() || !attachmentId?.trim() || !noteId?.trim()) return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Missing attachment target.', correlationId: null } }, { status: 400 });

  try {
    const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
    const response = await fetch(new URL(`/internal-tickets/${encodeURIComponent(id)}/notes/${encodeURIComponent(noteId)}/attachments/${encodeURIComponent(attachmentId)}/download?redirect=1`, apiUrl), {
      cache: 'no-store',
      headers: new Headers({ cookie: request.headers.get('cookie') ?? '' }),
      method: 'GET',
    });
    
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition || !contentType.includes('application/json')) {
        const body = await response.arrayBuffer();
        return new Response(body, {
          status: 200,
          headers: {
            'content-type': contentType || 'image/jpeg',
            'content-disposition': contentDisposition || `attachment; filename="attachment-${attachmentId}.jpg"`,
            'cache-control': 'no-store',
          },
        });
      }

      const data = await response.json();
      const token = data.url;
      let fileName = data.fileName || `attachment-${attachmentId}.jpg`;
      if (!fileName.includes('.')) fileName += '.jpg';

      if (token && typeof token === 'string' && (token.startsWith('http://') || token.startsWith('https://') || token.startsWith('/'))) {
        if (token.startsWith('/')) {
          const rawRes = await fetch(new URL(token, apiUrl), {
            cache: 'no-store',
            headers: new Headers({ cookie: request.headers.get('cookie') ?? '' }),
          });
          if (rawRes.ok) {
            const rawBuffer = await rawRes.arrayBuffer();
            return new Response(rawBuffer, {
              status: 200,
              headers: {
                'content-type': rawRes.headers.get('content-type') || 'image/jpeg',
                'content-disposition': rawRes.headers.get('content-disposition') || `attachment; filename="${encodeURIComponent(fileName)}"`,
                'cache-control': 'no-store',
              },
            });
          }
        }
        const target = token.startsWith('/') ? new URL(token, request.url).toString() : token;
        const redirectRes = NextResponse.redirect(target);
        redirectRes.headers.set('cache-control', 'no-store');
        return redirectRes;
      }
      return NextResponse.json({ error: { code: 'ATTACHMENT_DOWNLOAD_TARGET_UNAVAILABLE', message: 'Download target is unavailable.', correlationId: null } }, { status: 409 });
    }
    
    const body = await response.arrayBuffer();
    return new Response(body, { headers: new Headers({ 'content-type': 'application/json' }), status: response.status });
  } catch {
    return NextResponse.json({ error: { code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } }, { status: 502 });
  }
}

import { NextResponse } from 'next/server';

type RouteParams = { attachmentId?: string; id?: string };

export async function GET(request: Request, { params }: { params: Promise<RouteParams> }): Promise<Response> {
  const { attachmentId, id } = await params;
  if (!id?.trim() || !attachmentId?.trim()) return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Missing attachment target.', correlationId: null } }, { status: 400 });

  try {
    const response = await fetch(new URL(`/complaints/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}/download`, process.env.API_URL ?? 'http://localhost:3000'), {
      cache: 'no-store',
      headers: new Headers({ Accept: 'application/json', cookie: request.headers.get('cookie') ?? '' }),
      method: 'GET',
    });
    return new Response(await response.arrayBuffer(), { headers: jsonHeaders(response.headers), status: response.status });
  } catch {
    return NextResponse.json({ error: { code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } }, { status: 502 });
  }
}

function jsonHeaders(headers: Headers): Headers {
  return new Headers({ 'cache-control': 'no-store', 'content-type': headers.get('content-type') ?? 'application/json' });
}

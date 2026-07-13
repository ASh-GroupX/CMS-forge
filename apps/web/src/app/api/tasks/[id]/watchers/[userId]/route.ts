import { NextResponse } from 'next/server';

type RouteParams = { id?: string; userId?: string };

export async function DELETE(request: Request, { params }: { params: Promise<RouteParams> }): Promise<Response> {
  const { id, userId } = await params;
  if (!id?.trim() || !userId?.trim()) return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Missing watcher id.', correlationId: null } }, { status: 400 });
  try {
    const response = await fetch(new URL(`/tasks/${encodeURIComponent(id)}/watchers/${encodeURIComponent(userId)}`, process.env.API_URL ?? 'http://localhost:3000'), {
      cache: 'no-store', headers: forwardedHeaders(request), method: 'DELETE',
    });
    return new Response(await response.arrayBuffer(), { headers: { 'cache-control': 'no-store', 'content-type': response.headers.get('content-type') ?? 'application/json' }, status: response.status });
  } catch {
    return NextResponse.json({ error: { code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } }, { status: 502 });
  }
}

function forwardedHeaders(request: Request): Headers {
  const headers = new Headers({ Accept: 'application/json', cookie: request.headers.get('cookie') ?? '' });
  const csrf = request.headers.get('x-csrf-token');
  if (csrf) headers.set('x-csrf-token', csrf);
  return headers;
}

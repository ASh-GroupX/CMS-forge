import { NextResponse } from 'next/server';

type RouteParams = { id?: string };

export async function POST(request: Request, { params }: { params: Promise<RouteParams> }): Promise<Response> {
  const { id } = await params;
  if (!id?.trim()) return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Missing task id.', correlationId: null } }, { status: 400 });
  try {
    const response = await fetch(new URL(`/tasks/${encodeURIComponent(id)}/comments`, process.env.API_URL ?? 'http://localhost:3000'), {
      body: await request.text(), cache: 'no-store', headers: forwardedHeaders(request), method: 'POST',
    });
    return new Response(await response.arrayBuffer(), { headers: { 'cache-control': 'no-store', 'content-type': response.headers.get('content-type') ?? 'application/json' }, status: response.status });
  } catch {
    return NextResponse.json({ error: { code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } }, { status: 502 });
  }
}

function forwardedHeaders(request: Request): Headers {
  const headers = new Headers({ Accept: 'application/json', 'content-type': request.headers.get('content-type') ?? 'application/json', cookie: request.headers.get('cookie') ?? '' });
  const csrf = request.headers.get('x-csrf-token');
  if (csrf) headers.set('x-csrf-token', csrf);
  return headers;
}

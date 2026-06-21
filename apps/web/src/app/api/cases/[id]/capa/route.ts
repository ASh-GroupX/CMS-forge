import { NextResponse } from 'next/server';

type RouteParams = { id?: string };

export async function POST(request: Request, { params }: { params: Promise<RouteParams> }): Promise<Response> {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Missing case id.', correlationId: null } }, { status: 400 });
  }

  const target = new URL(`/cases/${encodeURIComponent(id)}/capa`, process.env.API_URL ?? 'http://localhost:3000');
  try {
    const headers = new Headers({
      Accept: 'application/json',
      'content-type': request.headers.get('content-type') ?? 'application/json',
      cookie: request.headers.get('cookie') ?? '',
    });
    const csrf = request.headers.get('x-csrf-token');
    if (csrf) headers.set('x-csrf-token', csrf);
    const response = await fetch(target, { body: await request.text(), cache: 'no-store', headers, method: 'POST' });
    return new Response(await response.arrayBuffer(), { headers: jsonHeaders(response.headers), status: response.status });
  } catch {
    return NextResponse.json({ error: { code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } }, { status: 502 });
  }
}

function jsonHeaders(headers: Headers): Headers {
  return new Headers({
    'cache-control': 'no-store',
    'content-type': headers.get('content-type') ?? 'application/json',
  });
}

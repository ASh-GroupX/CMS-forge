import { NextResponse } from 'next/server';

type RouteParams = { id?: string };

export async function GET(request: Request, { params }: { params: Promise<RouteParams> }): Promise<Response> {
  return proxy(request, params, 'GET');
}

export async function POST(request: Request, { params }: { params: Promise<RouteParams> }): Promise<Response> {
  return proxy(request, params, 'POST');
}

async function proxy(request: Request, params: Promise<RouteParams>, method: 'GET' | 'POST'): Promise<Response> {
  const { id } = await params;
  if (!id?.trim()) return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Missing complaint id.', correlationId: null } }, { status: 400 });

  try {
    const response = await fetch(new URL(`/complaints/${encodeURIComponent(id)}/attachments`, process.env.API_URL ?? 'http://localhost:3000'), {
      ...(method === 'POST' ? { body: await request.text() } : {}),
      cache: 'no-store',
      headers: forwardedHeaders(request, method),
      method,
    });
    return new Response(await response.arrayBuffer(), { headers: jsonHeaders(response.headers), status: response.status });
  } catch {
    return NextResponse.json({ error: { code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } }, { status: 502 });
  }
}

function forwardedHeaders(request: Request, method: 'GET' | 'POST'): Headers {
  const headers = new Headers({ Accept: 'application/json', cookie: request.headers.get('cookie') ?? '' });
  if (method === 'POST') headers.set('content-type', request.headers.get('content-type') ?? 'application/json');
  const csrf = request.headers.get('x-csrf-token');
  if (csrf) headers.set('x-csrf-token', csrf);
  return headers;
}

function jsonHeaders(headers: Headers): Headers {
  return new Headers({ 'cache-control': 'no-store', 'content-type': headers.get('content-type') ?? 'application/json' });
}

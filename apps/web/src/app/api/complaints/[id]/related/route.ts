import { NextResponse } from 'next/server';

type RouteParams = { id?: string };

export async function POST(request: Request, { params }: { params: Promise<RouteParams> }): Promise<Response> {
  const { id } = await params;
  if (!id?.trim()) return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Missing complaint id.', correlationId: null } }, { status: 400 });

  const target = new URL(`/complaints/${encodeURIComponent(id)}/related`, process.env.API_URL ?? 'http://localhost:3000');
  return forwardRelation(request, target, 'POST');
}

export async function DELETE(request: Request, { params }: { params: Promise<RouteParams> }): Promise<Response> {
  const { id } = await params;
  if (!id?.trim()) return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Missing complaint id.', correlationId: null } }, { status: 400 });

  const body = await request.json().catch(() => null) as { targetComplaintId?: unknown } | null;
  const targetComplaintId = typeof body?.targetComplaintId === 'string' ? body.targetComplaintId.trim() : '';
  if (!targetComplaintId) return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Missing target complaint id.', correlationId: null } }, { status: 400 });

  const target = new URL(`/complaints/${encodeURIComponent(id)}/related/${encodeURIComponent(targetComplaintId)}`, process.env.API_URL ?? 'http://localhost:3000');
  return forwardRelation(request, target, 'DELETE');
}

async function forwardRelation(request: Request, target: URL, method: 'DELETE' | 'POST'): Promise<Response> {
  try {
    const headers = new Headers({
      Accept: 'application/json',
      'content-type': request.headers.get('content-type') ?? 'application/json',
      cookie: request.headers.get('cookie') ?? '',
    });
    const csrf = request.headers.get('x-csrf-token');
    if (csrf) headers.set('x-csrf-token', csrf);
    const init: RequestInit = { cache: 'no-store', headers, method };
    if (method === 'POST') init.body = await request.text();
    const response = await fetch(target, init);
    return new Response(await response.arrayBuffer(), { headers: jsonHeaders(response.headers), status: response.status });
  } catch {
    return NextResponse.json({ error: { code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } }, { status: 502 });
  }
}

function jsonHeaders(headers: Headers): Headers {
  return new Headers({ 'cache-control': 'no-store', 'content-type': headers.get('content-type') ?? 'application/json' });
}

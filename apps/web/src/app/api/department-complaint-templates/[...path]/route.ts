import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ path?: string[] }> | { path?: string[] } };

export function GET(request: Request, context: RouteContext): Promise<Response> {
  return proxyTemplates(request, context, 'GET');
}

export function POST(request: Request, context: RouteContext): Promise<Response> {
  return proxyTemplates(request, context, 'POST');
}

export function PUT(request: Request, context: RouteContext): Promise<Response> {
  return proxyTemplates(request, context, 'PUT');
}

export function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return proxyTemplates(request, context, 'DELETE');
}

async function proxyTemplates(
  request: Request,
  context: RouteContext,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
): Promise<Response> {
  const resolvedParams = await context.params;
  const path = resolvedParams.path?.join('/') ?? '';
  const target = new URL(`/department-complaint-templates/${path}`, process.env.API_URL ?? 'http://localhost:3000');

  try {
    const headers = new Headers({
      Accept: 'application/json',
      cookie: request.headers.get('cookie') ?? '',
    });

    if (method !== 'GET' && method !== 'DELETE') {
      headers.set('content-type', request.headers.get('content-type') ?? 'application/json');
    }

    const csrf = request.headers.get('x-csrf-token');
    if (csrf) headers.set('x-csrf-token', csrf);

    const init: RequestInit = { cache: 'no-store', headers, method };
    if (method === 'POST' || method === 'PUT') {
      init.body = await request.text();
    }

    const response = await fetch(target, init);
    return new Response(await response.arrayBuffer(), {
      headers: jsonHeaders(response.headers),
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } },
      { status: 502 },
    );
  }
}

function jsonHeaders(headers: Headers): Headers {
  return new Headers({
    'cache-control': 'no-store',
    'content-type': headers.get('content-type') ?? 'application/json',
  });
}

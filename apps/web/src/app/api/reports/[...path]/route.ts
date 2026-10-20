import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ path?: string[] }> | { path?: string[] } };

export function GET(request: Request, context: RouteContext): Promise<Response> {
  return proxyReports(request, context, 'GET');
}

export function POST(request: Request, context: RouteContext): Promise<Response> {
  return proxyReports(request, context, 'POST');
}

async function proxyReports(
  request: Request,
  context: RouteContext,
  method: 'GET' | 'POST',
): Promise<Response> {
  const resolvedParams = await context.params;
  const path = resolvedParams.path?.join('/') ?? '';
  const incomingUrl = new URL(request.url);
  const target = new URL(`/reports/${path}`, process.env.API_URL ?? 'http://localhost:3000');
  target.search = incomingUrl.search;

  try {
    const headers = new Headers({
      Accept: request.headers.get('accept') ?? '*/*',
      cookie: request.headers.get('cookie') ?? '',
    });

    if (method === 'POST') {
      headers.set('content-type', request.headers.get('content-type') ?? 'application/json');
    }

    const csrf = request.headers.get('x-csrf-token');
    if (csrf) headers.set('x-csrf-token', csrf);

    const init: RequestInit = { cache: 'no-store', headers, method };
    if (method === 'POST') {
      init.body = await request.text();
    }

    const response = await fetch(target, init);
    const contentType = response.headers.get('content-type') ?? 'application/json';
    const contentDisposition = response.headers.get('content-disposition');
    
    const responseHeaders = new Headers({
      'cache-control': 'no-store',
      'content-type': contentType,
    });
    if (contentDisposition) {
      responseHeaders.set('content-disposition', contentDisposition);
    }

    return new Response(await response.arrayBuffer(), {
      headers: responseHeaders,
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'NETWORK_ERROR', message: 'Unable to reach backend reporting service.', correlationId: null } },
      { status: 502 },
    );
  }
}

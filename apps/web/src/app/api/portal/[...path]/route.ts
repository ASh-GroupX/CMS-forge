import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ path?: string[] }> | { path?: string[] } };

const allowed = new Set([
  'POST complaints',
  'POST tracking/otp',
  'POST tracking/otp/verify',
  'GET tracking',
  'POST tracking/follow-ups',
  'POST attachments',
]);

export function GET(request: Request, context: RouteContext): Promise<Response> {
  return proxyPortal(request, context, 'GET');
}

export function POST(request: Request, context: RouteContext): Promise<Response> {
  return proxyPortal(request, context, 'POST');
}

async function proxyPortal(request: Request, context: RouteContext, method: 'GET' | 'POST'): Promise<Response> {
  const path = (await context.params).path?.join('/') ?? '';
  if (!allowed.has(`${method} ${path}`)) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found.', correlationId: null } }, { status: 404 });
  }

  const target = new URL(`/portal/${path}`, process.env.API_URL ?? 'http://localhost:3000');
  try {
    const headers = new Headers({ Accept: 'application/json' });
    if (method === 'POST') headers.set('content-type', request.headers.get('content-type') ?? 'application/json');
    if (path === 'tracking' || path === 'tracking/follow-ups' || path === 'attachments') {
      const session = request.headers.get('x-portal-session');
      if (session) headers.set('x-portal-session', session);
    }

    const init: RequestInit = { cache: 'no-store', headers, method };
    if (method === 'POST') init.body = await request.text();
    const response = await fetch(target, init);
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

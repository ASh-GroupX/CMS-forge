import { NextResponse } from 'next/server';

const allowedParams = ['phone', 'customerNumber', 'vin', 'name'] as const;

export async function GET(request: Request): Promise<Response> {
  try {
    const response = await fetch(targetUrl(request), {
      cache: 'no-store',
      headers: forwardedHeaders(request),
      method: 'GET',
    });
    return new Response(await response.arrayBuffer(), { headers: jsonHeaders(response.headers), status: response.status });
  } catch {
    return NextResponse.json({ error: { code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } }, { status: 502 });
  }
}

function targetUrl(request: Request): URL {
  const source = new URL(request.url);
  const target = new URL('/integrations/dms/customer-vehicle', process.env.API_URL ?? 'http://localhost:3000');
  for (const key of allowedParams) {
    const value = source.searchParams.get(key)?.trim();
    if (value) target.searchParams.set(key, value);
  }
  return target;
}

function forwardedHeaders(request: Request): Headers {
  return new Headers({ Accept: 'application/json', cookie: request.headers.get('cookie') ?? '' });
}

function jsonHeaders(headers: Headers): Headers {
  return new Headers({ 'cache-control': 'no-store', 'content-type': headers.get('content-type') ?? 'application/json' });
}

import { NextResponse } from 'next/server';
import { appendAuditFilters } from '../../../../lib/staff-audit-api';

export async function GET(request: Request): Promise<Response> {
  const source = new URL(request.url);
  const target = new URL('/audit/logs/export', process.env.API_URL ?? 'http://localhost:3000');
  appendAuditFilters(target, Object.fromEntries(source.searchParams.entries()));

  try {
    const response = await fetch(target, {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: request.headers.get('cookie') ?? '' },
    });
    return new Response(await response.arrayBuffer(), { status: response.status, headers: passthroughHeaders(response.headers) });
  } catch {
    return NextResponse.json({ error: 'Audit export service is unavailable.' }, { status: 502 });
  }
}

function passthroughHeaders(headers: Headers): Headers {
  const result = new Headers({ 'cache-control': 'no-store' });
  for (const name of ['content-disposition', 'content-type']) {
    const value = headers.get(name);
    if (value) result.set(name, value);
  }
  return result;
}

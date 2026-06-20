import { NextResponse } from 'next/server';

const formats = new Set(['csv', 'excel']);

export async function GET(request: Request): Promise<Response> {
  const source = new URL(request.url);
  const format = source.searchParams.get('format') ?? '';
  if (!formats.has(format)) return NextResponse.json({ error: 'Invalid report format.' }, { status: 400 });

  const target = new URL('/reports/export', process.env.API_URL ?? 'http://localhost:3000');
  target.searchParams.set('format', format);

  try {
    const response = await fetch(target, {
      cache: 'no-store',
      headers: {
        Accept: 'text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
        cookie: request.headers.get('cookie') ?? '',
      },
    });
    return new Response(await response.arrayBuffer(), {
      status: response.status,
      headers: passthroughHeaders(response.headers),
    });
  } catch {
    return NextResponse.json({ error: 'Report export service is unavailable.' }, { status: 502 });
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

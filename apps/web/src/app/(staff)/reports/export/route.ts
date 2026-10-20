import { NextResponse } from 'next/server';

export async function GET(request: Request): Promise<Response> {
  const incomingUrl = new URL(request.url);
  const format = incomingUrl.searchParams.get('format');
  if (format !== 'csv' && format !== 'excel') {
    return NextResponse.json(
      { error: { code: 'INVALID_FORMAT', message: 'Supported formats are csv and excel.' } },
      { status: 400 },
    );
  }

  const target = new URL('/reports/export', process.env.API_URL ?? 'http://localhost:3000');
  target.search = incomingUrl.search;

  try {
    const cookies = request.headers.get('cookie') ?? '';
    const res = await fetch(target, {
      headers: {
        cookie: cookies,
        Accept: '*/*',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: { code: 'EXPORT_FAILED', message: 'Failed to generate export file.' } },
        { status: res.status },
      );
    }

    const contentType = res.headers.get('content-type') ?? 'text/csv; charset=utf-8';
    const contentDisposition =
      res.headers.get('content-disposition') ?? 'attachment; filename="operational-report.csv"';
    const rowCount = res.headers.get('x-report-row-count');

    const headers = new Headers({
      'content-type': contentType,
      'content-disposition': contentDisposition,
      'cache-control': 'no-store',
    });
    if (rowCount) headers.set('x-report-row-count', rowCount);

    return new Response(await res.arrayBuffer(), {
      status: 200,
      headers,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'NETWORK_ERROR', message: 'Unable to reach reporting service.' } },
      { status: 502 },
    );
  }
}

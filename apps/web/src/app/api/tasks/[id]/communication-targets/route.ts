import { NextResponse } from 'next/server';

type RouteParams = { id?: string };

export async function GET(request: Request, { params }: { params: Promise<RouteParams> }): Promise<Response> {
  const { id } = await params;
  if (!id?.trim()) return NextResponse.json({ error: { code: 'VALIDATION_FAILED', message: 'Missing task id.', correlationId: null } }, { status: 400 });
  try {
    const target = new URL(`/tasks/${encodeURIComponent(id)}/communication-targets`, process.env.API_URL ?? 'http://localhost:3000');
    target.searchParams.set('q', new URL(request.url).searchParams.get('q') ?? '');
    const response = await fetch(target, { cache: 'no-store', headers: { Accept: 'application/json', cookie: request.headers.get('cookie') ?? '' } });
    return new Response(await response.arrayBuffer(), { headers: { 'cache-control': 'no-store', 'content-type': response.headers.get('content-type') ?? 'application/json' }, status: response.status });
  } catch {
    return NextResponse.json({ error: { code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } }, { status: 502 });
  }
}

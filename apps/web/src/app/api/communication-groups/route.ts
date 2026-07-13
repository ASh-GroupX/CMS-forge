import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<Response> {
  try {
    const response = await fetch(new URL('/communication-groups', process.env.API_URL ?? 'http://localhost:3000'), { body: await request.text(), cache: 'no-store', headers: forwardedHeaders(request), method: 'POST' });
    return responseFrom(response);
  } catch { return failure(); }
}

function forwardedHeaders(request: Request): Headers { const headers = new Headers({ Accept: 'application/json', 'content-type': request.headers.get('content-type') ?? 'application/json', cookie: request.headers.get('cookie') ?? '' }); const csrf = request.headers.get('x-csrf-token'); if (csrf) headers.set('x-csrf-token', csrf); return headers; }
async function responseFrom(response: Response): Promise<Response> { return new Response(await response.arrayBuffer(), { headers: { 'cache-control': 'no-store', 'content-type': response.headers.get('content-type') ?? 'application/json' }, status: response.status }); }
function failure(): Response { return NextResponse.json({ error: { code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } }, { status: 502 }); }

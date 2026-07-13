import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const target = new URL('/search', process.env.API_URL ?? 'http://localhost:3000');
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.append(key, value));
  try {
    const response = await fetch(target, { cache: 'no-store', headers: { Accept: 'application/json', cookie: request.headers.get('cookie') ?? '' } });
    return new NextResponse(await response.text(), { status: response.status, headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' } });
  } catch {
    return NextResponse.json({ code: 'SEARCH_UNAVAILABLE' }, { status: 503 });
  }
}

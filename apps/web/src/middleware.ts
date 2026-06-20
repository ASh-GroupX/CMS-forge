import { NextResponse, type NextRequest } from 'next/server';
import { resolveLocale, type Locale } from './i18n/staff-shell';

const rootLocaleHeader = 'x-cms-locale';

export function resolveRequestLocale(url: URL): Locale {
  return resolveLocale(url.searchParams.get('locale') ?? undefined);
}

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(rootLocaleHeader, resolveRequestLocale(request.nextUrl));
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

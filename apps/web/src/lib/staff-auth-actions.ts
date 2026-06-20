'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const CSRF_COOKIE = 'cms_csrf_token';

export async function loginStaffAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const response = await fetch(new URL('/auth/login', API_URL), {
    body: JSON.stringify({
      identifier: String(formData.get('identifier') ?? ''),
      password: String(formData.get('password') ?? ''),
    }),
    cache: 'no-store',
    headers: { Accept: 'application/json', 'content-type': 'application/json' },
    method: 'POST',
  });

  if (!response.ok) redirect(`/?locale=${locale}&auth=error`);
  await applySetCookie(response.headers);
  redirect(`/?locale=${locale}`);
}

export async function logoutStaffAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(new URL('/auth/logout', API_URL), {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      cookie: cookieHeader,
      ...(readCookie(cookieHeader, CSRF_COOKIE) ? { 'x-csrf-token': readCookie(cookieHeader, CSRF_COOKIE)! } : {}),
    },
    method: 'POST',
  });

  await applySetCookie(response.headers);
  redirect(`/?locale=${locale}`);
}

async function applySetCookie(headers: Headers): Promise<void> {
  const store = await cookies();
  for (const header of setCookieHeaders(headers)) {
    const cookie = parseSetCookie(header);
    if (!cookie) continue;
    if (cookie.value === '' || cookie.options.maxAge === 0) {
      store.delete(cookie.name);
    } else {
      store.set(cookie.name, cookie.value, cookie.options);
    }
  }
}

function setCookieHeaders(headers: Headers): string[] {
  const native = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();
  if (native?.length) return native;
  const header = headers.get('set-cookie');
  return header ? header.split(/,(?=\s*[^;,]+=)/).map((value) => value.trim()) : [];
}

function parseSetCookie(header: string): {
  name: string;
  value: string;
  options: { expires?: Date; httpOnly?: boolean; maxAge?: number; path?: string; sameSite?: 'lax' | 'strict' | 'none'; secure?: boolean };
} | null {
  const [nameValue, ...attributes] = header.split(';').map((part) => part.trim());
  const index = nameValue?.indexOf('=') ?? -1;
  if (!nameValue || index <= 0) return null;

  const cookie = { name: nameValue.slice(0, index), value: nameValue.slice(index + 1), options: {} as NonNullable<ReturnType<typeof parseSetCookie>>['options'] };
  for (const attribute of attributes) {
    const [rawName, rawValue = ''] = attribute.split('=');
    const name = rawName?.toLowerCase();
    if (name === 'httponly') cookie.options.httpOnly = true;
    if (name === 'secure') cookie.options.secure = true;
    if (name === 'path') cookie.options.path = rawValue;
    if (name === 'max-age') cookie.options.maxAge = Number(rawValue);
    if (name === 'expires') cookie.options.expires = new Date(rawValue);
    if (name === 'samesite' && ['lax', 'strict', 'none'].includes(rawValue.toLowerCase())) {
      cookie.options.sameSite = rawValue.toLowerCase() as 'lax' | 'strict' | 'none';
    }
  }
  return cookie;
}

function readCookie(header: string, name: string): string | null {
  return header
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1) ?? null;
}

function safeLocale(value: FormDataEntryValue | null): 'ar' | 'en' {
  return value === 'ar' ? 'ar' : 'en';
}

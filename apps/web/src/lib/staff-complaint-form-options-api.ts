export type ComplaintFormOption = { id: string; code: string; nameEn: string; nameAr: string; parentId?: string | null };
export type ComplaintFormOptions = {
  branches: ComplaintFormOption[];
  categories: ComplaintFormOption[];
  severities: Array<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>;
};

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export async function getComplaintFormOptions({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<ComplaintFormOptions | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;
  try {
    const response = await fetchImpl(new URL('/complaints/form-options', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    return response.ok ? ((await response.json()) as ComplaintFormOptions) : null;
  } catch {
    return null;
  }
}

function hasStaffSessionCookie(cookieHeader: string): boolean {
  return cookieHeader.split(';').some((cookie) => cookie.trim().startsWith(`${STAFF_SESSION_COOKIE}=`));
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    return (await cookies()).toString();
  } catch {
    return '';
  }
}

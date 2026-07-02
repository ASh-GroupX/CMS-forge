const STAFF_SESSION_COOKIE = 'cms_staff_session';

export type StaffComplaintSurvey = { id: string; complaintId: string; rating: number; comment: string | null; submittedAt: string };

export async function getStaffComplaintSurveys({ apiUrl = process.env.API_URL ?? 'http://localhost:3000', complaintId, cookieHeader, fetchImpl = fetch }: { apiUrl?: string; complaintId?: string; cookieHeader?: string; fetchImpl?: typeof fetch } = {}): Promise<StaffComplaintSurvey[] | null> {
  const id = complaintId?.trim();
  if (!id) return null;
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!cookies.split(';').some((cookie) => cookie.trim().startsWith(`${STAFF_SESSION_COOKIE}=`))) return null;
  try {
    const response = await fetchImpl(new URL(`/complaints/${encodeURIComponent(id)}/surveys`, apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return null;
    const body = await response.json() as { items?: unknown[] };
    return Array.isArray(body.items) ? body.items.filter(staffSurvey) : null;
  } catch {
    return null;
  }
}

function staffSurvey(value: unknown): value is StaffComplaintSurvey {
  const item = value as Partial<StaffComplaintSurvey>;
  return typeof item?.id === 'string' && typeof item.complaintId === 'string' && typeof item.rating === 'number' && typeof item.submittedAt === 'string' && (item.comment === null || typeof item.comment === 'string');
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    return (await cookies()).toString();
  } catch {
    return '';
  }
}

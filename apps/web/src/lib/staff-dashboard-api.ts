export type StaffDashboardSummary = {
  openComplaints: number;
  overdueComplaints: number;
  slaWarningComplaints: number;
  closedComplaints: number;
  averageTatHours: number;
};

type DashboardResponse = { summary?: Partial<StaffDashboardSummary> };

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export async function getStaffDashboardSummary({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<StaffDashboardSummary | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const response = await fetchImpl(new URL('/reports/dashboard', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return null;
    return summaryFrom((await response.json()) as DashboardResponse);
  } catch {
    return null;
  }
}

function summaryFrom(body: DashboardResponse): StaffDashboardSummary | null {
  const summary = body.summary;
  if (
    !nonNegativeNumber(summary?.openComplaints) ||
    !nonNegativeNumber(summary.overdueComplaints) ||
    !nonNegativeNumber(summary.slaWarningComplaints) ||
    !nonNegativeNumber(summary.closedComplaints) ||
    !nonNegativeNumber(summary.averageTatHours)
  ) {
    return null;
  }

  return {
    openComplaints: summary.openComplaints,
    overdueComplaints: summary.overdueComplaints,
    slaWarningComplaints: summary.slaWarningComplaints,
    closedComplaints: summary.closedComplaints,
    averageTatHours: summary.averageTatHours,
  };
}

function nonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
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

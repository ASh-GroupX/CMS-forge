import { hasStaffSessionCookie, incomingCookieHeader } from './staff-request-auth';
import { fetchComplaintTimelineResult, type ComplaintTimelineItem } from './staff-complaint-timeline-api';

// Fetch-on-open payload for the ticket board's quick-look drawer (B6). Reuses the
// authorized timeline endpoint (which already unifies comments, status changes and
// SLA events under server-side branch/visibility scoping) — the drawer never adds
// a read path that sidesteps that authorization.

export type ComplaintCardDetail =
  | { status: 'ready'; timeline: ComplaintTimelineItem[] }
  | { status: 'denied' | 'error' };

type RequestOptions = { apiUrl?: string; cookieHeader?: string; fetchImpl?: typeof fetch };

export async function getComplaintCardDetail(
  complaintId: string,
  { apiUrl = process.env.API_URL ?? 'http://localhost:3000', cookieHeader, fetchImpl = fetch }: RequestOptions = {},
): Promise<ComplaintCardDetail> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return { status: 'denied' };
  // A transport/parse failure surfaces as the drawer's error state; a valid-but-empty
  // timeline stays 'ready' (mirrors the task drawer via getStaffTaskComments → null).
  const result = await fetchComplaintTimelineResult({ apiUrl, complaintId, cookies, fetchImpl });
  return result.ok ? { status: 'ready', timeline: result.items } : { status: 'error' };
}

export type { ComplaintTimelineItem };

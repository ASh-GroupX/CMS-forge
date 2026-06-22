export type StaffConfidentialCaseTimeline = {
  case: {
    id: string;
    type: string;
    lifecycleStatus: string;
    confidentialityLevel: string;
    subject: string;
    branchId: string;
    branchName: string;
    ownerId: string | null;
    ownerName: string | null;
    createdAt: string;
    updatedAt: string;
  };
  restrictedNotes: { id: string; authorId: string | null; authorName?: string | null; body: string; createdAt: string }[];
  events: { type: string; occurredAt: string; entityType?: string; entityId?: string }[];
};

type TimelineResponse = Partial<StaffConfidentialCaseTimeline>;

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export async function getStaffConfidentialCaseTimeline({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  caseId,
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  caseId: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
}): Promise<StaffConfidentialCaseTimeline | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!caseId.trim() || !hasStaffSessionCookie(cookies)) return null;

  try {
    const response = await fetchImpl(new URL(`/cases/${encodeURIComponent(caseId)}/confidential-timeline`, apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return null;
    return timelineFrom((await response.json()) as TimelineResponse);
  } catch {
    return null;
  }
}

function timelineFrom(body: TimelineResponse): StaffConfidentialCaseTimeline | null {
  if (!body.case || !Array.isArray(body.restrictedNotes) || !Array.isArray(body.events)) return null;
  const caseItem = body.case;
  if (
    typeof caseItem.id !== 'string' ||
    typeof caseItem.type !== 'string' ||
    typeof caseItem.lifecycleStatus !== 'string' ||
    typeof caseItem.confidentialityLevel !== 'string' ||
    typeof caseItem.subject !== 'string' ||
    typeof caseItem.branchId !== 'string' ||
    typeof caseItem.branchName !== 'string' ||
    typeof caseItem.createdAt !== 'string' ||
    typeof caseItem.updatedAt !== 'string'
  ) {
    return null;
  }
  const restrictedNotes = body.restrictedNotes.every(isNote) ? body.restrictedNotes : null;
  const events = body.events.every(isEvent) ? body.events : null;
  if (!restrictedNotes || !events) return null;
  return {
    case: {
      id: caseItem.id,
      type: caseItem.type,
      lifecycleStatus: caseItem.lifecycleStatus,
      confidentialityLevel: caseItem.confidentialityLevel,
      subject: caseItem.subject,
      branchId: caseItem.branchId,
      branchName: caseItem.branchName,
      ownerId: typeof caseItem.ownerId === 'string' ? caseItem.ownerId : null,
      ownerName: typeof caseItem.ownerName === 'string' ? caseItem.ownerName : null,
      createdAt: caseItem.createdAt,
      updatedAt: caseItem.updatedAt,
    },
    restrictedNotes,
    events,
  };
}

function isNote(note: unknown): note is StaffConfidentialCaseTimeline['restrictedNotes'][number] {
  return Boolean(note && typeof note === 'object'
    && typeof (note as { id?: unknown }).id === 'string'
    && (((note as { authorId?: unknown }).authorId === null) || typeof (note as { authorId?: unknown }).authorId === 'string')
    && (((note as { authorName?: unknown }).authorName === undefined) || ((note as { authorName?: unknown }).authorName === null) || typeof (note as { authorName?: unknown }).authorName === 'string')
    && typeof (note as { body?: unknown }).body === 'string'
    && typeof (note as { createdAt?: unknown }).createdAt === 'string');
}

function isEvent(event: unknown): event is StaffConfidentialCaseTimeline['events'][number] {
  return Boolean(event && typeof event === 'object'
    && typeof (event as { type?: unknown }).type === 'string'
    && typeof (event as { occurredAt?: unknown }).occurredAt === 'string');
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

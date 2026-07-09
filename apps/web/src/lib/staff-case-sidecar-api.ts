export type DetailTimelineItem = { at: string; label: string };

export type CaseCapaAction = {
  id: string;
  caseId: string;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  ownerId: string;
  ownerName: string;
  dueAt: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  createdAt: string;
  updatedAt: string;
};

export type CaseCapaCreateRequest = {
  ownerId?: string | null;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  dueAt: string;
  status: CaseCapaAction['status'];
};

export async function fetchCaseTimeline({ apiUrl, caseId, cookies, fetchImpl }: { apiUrl: string; caseId: string; cookies: string; fetchImpl: typeof fetch }): Promise<DetailTimelineItem[]> {
  try {
    const response = await fetchImpl(new URL(`/cases/${encodeURIComponent(caseId)}/timeline`, apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return [];
    const body = await response.json() as { events?: Array<{ type?: string; occurredAt?: string; toStatus?: string; action?: string | null }> };
    return Array.isArray(body.events) ? body.events.filter((item) => typeof item.occurredAt === 'string' && typeof item.type === 'string').map(caseTimelineItem) : [];
  } catch {
    return [];
  }
}

export async function fetchCaseCapa({ apiUrl, caseId, cookies, fetchImpl }: { apiUrl: string; caseId: string; cookies: string; fetchImpl: typeof fetch }): Promise<CaseCapaAction[]> {
  try {
    const response = await fetchImpl(new URL(`/cases/${encodeURIComponent(caseId)}/capa`, apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return [];
    const body = await response.json() as { items?: unknown[] };
    return Array.isArray(body.items) ? body.items.filter(caseCapaAction) : [];
  } catch {
    return [];
  }
}

export async function createCaseCapa(caseId: string, body: CaseCapaCreateRequest, fetchImpl: typeof fetch = fetch): Promise<CaseCapaAction> {
  const response = await fetchImpl(`/api/cases/${encodeURIComponent(caseId)}/capa`, {
    body: JSON.stringify(body),
    credentials: 'include',
    headers: { Accept: 'application/json', ...csrfHeaders() },
    method: 'POST',
  });
  const payload = await response.json().catch(() => null) as { capa?: CaseCapaAction; error?: { message?: string } } | null;
  if (!response.ok || !payload?.capa) throw new Error(payload?.error?.message ?? 'CAPA could not be created.');
  return payload.capa;
}

function caseCapaAction(item: unknown): item is CaseCapaAction {
  const row = item as Partial<CaseCapaAction>;
  return typeof row?.id === 'string'
    && typeof row.caseId === 'string'
    && typeof row.rootCause === 'string'
    && typeof row.correctiveAction === 'string'
    && typeof row.preventiveAction === 'string'
    && typeof row.ownerId === 'string'
    && typeof row.ownerName === 'string'
    && typeof row.dueAt === 'string'
    && (row.status === 'OPEN' || row.status === 'IN_PROGRESS' || row.status === 'DONE')
    && typeof row.createdAt === 'string'
    && typeof row.updatedAt === 'string';
}

function caseTimelineItem(item: { type?: string; occurredAt?: string; toStatus?: string; action?: string | null }): DetailTimelineItem {
  const label = item.type === 'COMPLAINT_STATUS' && item.toStatus ? `Complaint ${item.toStatus}` : item.type?.replaceAll('_', ' ');
  return { at: item.occurredAt ?? '', label: label ?? '' };
}

function csrfHeaders(): HeadersInit {
  const csrfToken = readableCookie('cms_csrf_token');
  return csrfToken ? { 'content-type': 'application/json', 'x-csrf-token': csrfToken } : { 'content-type': 'application/json' };
}

function readableCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${encodeURIComponent(name)}=`;
  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length) ?? null;
}

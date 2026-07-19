export type ComplaintTimelineItem = {
  id: string;
  type:
    | 'ASSIGNMENT'
    | 'ATTACHMENT'
    | 'CAPA'
    | 'COMMENT'
    | 'COMPLAINT_STATUS'
    | 'NOTIFICATION'
    | 'PUBLIC_UPDATE'
    | 'SLA'
    | 'STATUS'
    | 'TASK'
    | 'TASK_COMMENT'
    | 'TASK_STATUS'
    | 'WORKFLOW';
  createdAt: string;
  actor: { id: string | null; name: string | null; role: string | null } | null;
  visibility: 'INTERNAL' | 'PUBLIC' | 'SYSTEM';
  customerVisible: boolean;
  summary: string;
  body?: string | null;
  related?: { type: string; id: string; label?: string | null } | null;
  metadata?: Record<string, string | number | boolean | null>;
};

type TimelineArgs = { apiUrl: string; complaintId: string; cookies: string; fetchImpl: typeof fetch };

// Distinguishes a transport/parse failure ({ ok: false }) from a valid-but-empty
// timeline ({ ok: true, items: [] }). The board's quick-look drawer needs that
// distinction to surface a real error state (mirroring the task drawer); the full
// detail page keeps swallowing failures via fetchComplaintTimeline below.
export async function fetchComplaintTimelineResult({ apiUrl, complaintId, cookies, fetchImpl }: TimelineArgs): Promise<{ ok: true; items: ComplaintTimelineItem[] } | { ok: false }> {
  try {
    const response = await fetchImpl(new URL(`/complaints/${encodeURIComponent(complaintId)}/timeline`, apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return { ok: false };
    const body = await response.json() as { items?: unknown[] };
    return { ok: true, items: Array.isArray(body.items) ? body.items.filter(communicationTimelineItem) : [] };
  } catch {
    return { ok: false };
  }
}

export async function fetchComplaintTimeline(args: TimelineArgs): Promise<ComplaintTimelineItem[]> {
  const result = await fetchComplaintTimelineResult(args);
  return result.ok ? result.items : [];
}

function communicationTimelineItem(item: unknown): item is ComplaintTimelineItem {
  const row = item as Partial<ComplaintTimelineItem>;
  const actor = row?.actor as Partial<NonNullable<ComplaintTimelineItem['actor']>> | null | undefined;
  return typeof row?.id === 'string'
    && typeof row.type === 'string'
    && typeof row.createdAt === 'string'
    && (row.visibility === 'INTERNAL' || row.visibility === 'PUBLIC' || row.visibility === 'SYSTEM')
    && typeof row.customerVisible === 'boolean'
    && typeof row.summary === 'string'
    && (row.actor === null || row.actor === undefined || typeof actor?.id === 'string' || actor?.id === null);
}

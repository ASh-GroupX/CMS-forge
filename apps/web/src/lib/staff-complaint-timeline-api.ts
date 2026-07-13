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

export async function fetchComplaintTimeline({ apiUrl, complaintId, cookies, fetchImpl }: { apiUrl: string; complaintId: string; cookies: string; fetchImpl: typeof fetch }): Promise<ComplaintTimelineItem[]> {
  try {
    const response = await fetchImpl(new URL(`/complaints/${encodeURIComponent(complaintId)}/timeline`, apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return [];
    const body = await response.json() as { items?: unknown[] };
    return Array.isArray(body.items) ? body.items.filter(communicationTimelineItem) : [];
  } catch {
    return [];
  }
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

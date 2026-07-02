import React from 'react';
import { AuditViewer, type AuditPreviewState } from '../../../components/audit-viewer';
import { resolveLocale } from '../../../i18n/staff-shell';
import { getStaffAuditLogs, type StaffAuditFilters } from '../../../lib/staff-audit-api';

type SearchParams = { [key in keyof StaffAuditFilters]?: string | string[] } & { admin?: string | string[]; audit?: string | string[]; locale?: string | string[] };

export default async function AuditPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = auditFilters(params);
  const loaded = await getStaffAuditLogs({ filters });
  const state = resolveState(readParam(params?.audit) ?? readParam(params?.admin)) ?? (loaded.status === 'ready' ? undefined : loaded.status);
  return <AuditViewer filters={filters} locale={resolveLocale(readParam(params?.locale))} result={loaded.status === 'ready' ? loaded.data : undefined} state={state} />;
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveState(value: string | undefined): AuditPreviewState | undefined {
  return value === 'loading' || value === 'empty' || value === 'error' || value === 'success' || value === 'validation' || value === 'conflict' || value === 'denied'
    ? value
    : undefined;
}

function auditFilters(params: SearchParams | undefined): StaffAuditFilters {
  const filters: StaffAuditFilters = {};
  for (const key of ['actorId', 'correlationId', 'eventType', 'from', 'page', 'pageSize', 'targetId', 'targetType', 'to'] as const) {
    const value = readParam(params?.[key]);
    if (value !== undefined) filters[key] = value;
  }
  return filters;
}

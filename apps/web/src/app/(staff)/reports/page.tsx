import React from 'react';
import { ReportsDashboard, type ReportsPreviewState } from '../../../components/reports-dashboard';
import { resolveLocale } from '../../../i18n/staff-shell';
import { getStaffReportRows } from '../../../lib/staff-reports-api';

type SearchParams = { locale?: string | string[]; reports?: string | string[] };

export default async function ReportsPage({
  cookieHeader,
  fetchImpl,
  searchParams,
}: {
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const apiInput = {
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  };
  const rows = await getStaffReportRows(apiInput);
  return (
    <ReportsDashboard
      locale={resolveLocale(readParam(params?.locale))}
      rows={rows ?? undefined}
      state={resolveState(readParam(params?.reports))}
    />
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveState(value: string | undefined): ReportsPreviewState | undefined {
  return value === 'ready' || value === 'loading' || value === 'empty' || value === 'error' || value === 'success' || value === 'validation' || value === 'denied' || value === 'conflict'
    ? value
    : undefined;
}

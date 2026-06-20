import React from 'react';
import { DashboardSummary } from '../../../components/dashboard-summary';
import { resolveLocale } from '../../../i18n/staff-shell';
import { getStaffDashboardSummary } from '../../../lib/staff-dashboard-api';

type SearchParams = { locale?: string | string[] };

export default async function DashboardPage({
  cookieHeader,
  fetchImpl,
  searchParams,
}: {
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(readParam(params?.locale));
  const apiInput = {
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  };
  const data = await getStaffDashboardSummary(apiInput);
  return <DashboardSummary locale={locale} data={data} />;
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

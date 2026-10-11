import React from 'react';
import { getStaffSessionPrincipal } from '../../../lib/staff-session-api';
import { PremiumDashboard } from '../../../components/dashboard-premium';
import { resolveLocale } from '../../../i18n/staff-shell';
import { headers } from 'next/headers';
import { getPremiumDashboardSummary } from '../../../lib/staff-dashboard-api';
import { getComplaintFormOptions } from '../../../lib/staff-complaint-form-options-api';

type SearchParams = { filterType?: string; dateFrom?: string; dateTo?: string; categoryId?: string; severity?: string };

export default async function DashboardPage({
  searchParams,
  cookieHeader: propCookieHeader,
  locale: propLocale,
  fetchImpl,
}: {
  searchParams?: Promise<SearchParams>;
  cookieHeader?: string;
  locale?: 'en' | 'ar';
  fetchImpl?: typeof fetch;
}) {
  const params = await searchParams;
  let cookieHeader = propCookieHeader;
  let locale = propLocale;
  
  if (!cookieHeader) {
    const requestHeaders = await headers();
    locale = locale || resolveLocale(requestHeaders.get('x-cms-locale') ?? undefined);
    cookieHeader = requestHeaders.get('cookie') ?? '';
  } else {
    locale = locale || resolveLocale(undefined);
  }
  
  const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
  const apiInput = { cookieHeader, apiUrl, ...(fetchImpl !== undefined ? { fetchImpl } : {}) };

  const principal = await getStaffSessionPrincipal(apiInput);
  const dashboardData = await getPremiumDashboardSummary(apiInput);
  
  const doFetch = fetchImpl || fetch;
  const optionsRes = await doFetch(`${apiUrl}/internal-tickets/options`, {
    headers: { 'Cookie': cookieHeader },
    cache: 'no-store'
  });
  const internalOptions = optionsRes.ok ? await optionsRes.json() : {};
  // For severities, InternalTickets usually have HIGH/MEDIUM/LOW/CRITICAL, or we can just mock them if missing.
  const options = {
    categories: internalOptions.categories || [],
    severities: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    departments: internalOptions.departments || []
  };

  const queryParams = new URLSearchParams();
  if (params?.filterType) queryParams.set('filterType', params.filterType);
  if (params?.dateFrom) queryParams.set('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.set('dateTo', params.dateTo);
  if (params?.categoryId && params.categoryId !== 'all') queryParams.set('categoryId', params.categoryId);
  if (params?.severity && params.severity !== 'all') queryParams.set('severity', params.severity);

  const workloadRes = await doFetch(`${apiUrl}/internal-tickets/team-workload?${queryParams.toString()}`, {
    headers: { 'Cookie': cookieHeader },
    cache: 'no-store'
  });
  const workloadData = workloadRes.ok ? await workloadRes.json() : [];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface-canvas p-6">
      <PremiumDashboard locale={locale} principal={principal} data={dashboardData} workloadData={workloadData} options={options} />
    </div>
  );
}

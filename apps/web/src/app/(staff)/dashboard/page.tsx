import React from 'react';
import { getStaffSessionPrincipal } from '../../../lib/staff-session-api';
import { PremiumDashboard } from '../../../components/dashboard-premium';
import { resolveLocale } from '../../../i18n/staff-shell';
import { headers } from 'next/headers';
import { DashboardSummary } from '../../../components/dashboard-summary';
import { getEmployeeTodayTasks } from '../../../lib/staff-tasks-api';
import { staffShellText } from '../../../i18n/staff-shell';
import { getStaffDashboardSummary, getPremiumDashboardSummary } from '../../../lib/staff-dashboard-api';

type SearchParams = { locale?: string };

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
  let locale = propLocale ?? (params?.locale ? resolveLocale(params.locale) : undefined);
  
  if (cookieHeader === undefined) {
    try {
    const requestHeaders = await headers();
    locale = locale || resolveLocale(requestHeaders.get('x-cms-locale') ?? undefined);
    cookieHeader = requestHeaders.get('cookie') ?? '';
    } catch { cookieHeader = ''; }
  } else {
    locale = locale || resolveLocale(undefined);
  }
  
  locale ??= 'en';
  const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
  const apiInput = { cookieHeader, apiUrl, ...(fetchImpl !== undefined ? { fetchImpl } : {}) };

  const principal = await getStaffSessionPrincipal(apiInput);
  const dashboardData = await getPremiumDashboardSummary(apiInput);
  
  if (!dashboardData || !('crm' in dashboardData || 'admin' in dashboardData || 'manager' in dashboardData || 'officer' in dashboardData)) {
    const [summary, tasks] = await Promise.all([getStaffDashboardSummary(apiInput), getEmployeeTodayTasks(apiInput)]);
    return <><h1>{staffShellText[locale].dashboard.title}</h1><DashboardSummary data={summary} tasks={summary ? tasks : null} principal={principal} locale={locale} /></>;
  }
  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface-canvas p-6">
      <PremiumDashboard locale={locale} principal={principal} data={dashboardData} />
    </div>
  );
}

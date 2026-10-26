import React from 'react';
import { headers } from 'next/headers';
import { resolveLocale } from '../../../i18n/staff-shell';
import { getComplaintFormOptions } from '../../../lib/staff-complaint-form-options-api';
import { getStaffSessionPrincipal } from '../../../lib/staff-session-api';
import {
  fetchComplaintsAnalytics,
  fetchComplaintsRecords,
  fetchTicketsAnalytics,
  fetchTicketsRecords,
} from '../../../lib/staff-reports-analytics-api';
import { fetchDepartmentPerformance } from '../../../lib/staff-reports-departments-api';
import { EnterpriseReportsDashboard } from '../../../components/reports/enterprise-reports-dashboard';
import { ReportsHubNavigator } from '../../../components/reports/reports-hub-navigator';

type SearchParams = {
  locale?: string | string[];
  branchId?: string | string[];
  departmentId?: string | string[];
  dateFrom?: string | string[];
  dateTo?: string | string[];
};

export default async function ReportsPage({
  searchParams,
  cookieHeader: propCookieHeader,
}: {
  searchParams?: Promise<SearchParams>;
  cookieHeader?: string;
}) {
  const params = await searchParams;
  let cookieHeader = propCookieHeader;
  if (cookieHeader === undefined) {
    try {
      const requestHeaders = await headers();
      cookieHeader = requestHeaders.get('cookie') ?? '';
    } catch {
      cookieHeader = '';
    }
  }

  const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
  const apiInput = { cookieHeader, apiUrl };

  const [
    principal,
    options,
    departmentsPerformance,
    complaintsAnalytics,
    complaintsRecords,
    ticketsAnalytics,
    ticketsRecords,
  ] = await Promise.all([
    getStaffSessionPrincipal(apiInput),
    getComplaintFormOptions(apiInput),
    fetchDepartmentPerformance({}, cookieHeader, apiUrl),
    fetchComplaintsAnalytics({}, cookieHeader, apiUrl),
    fetchComplaintsRecords({}, 50, 0, cookieHeader, apiUrl),
    fetchTicketsAnalytics({}, cookieHeader, apiUrl),
    fetchTicketsRecords({}, 50, 0, cookieHeader, apiUrl),
  ]);

  const activeLocale = resolveLocale(readParam(params?.locale));
  const isRtl = activeLocale === 'ar';
  const isAdmin = principal?.roleCode === 'ADMIN';

  const departments = (options?.departments ?? []).map((d) => ({
    id: d.id,
    name: isRtl ? d.nameAr : d.nameEn,
  }));

  const userDept = (options?.departments ?? []).find(
    (d) => d.id === principal?.departmentId,
  );
  const userDepartmentName = userDept ? (isRtl ? userDept.nameAr : userDept.nameEn) : null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      {/* Quick Nav Hub */}
      <ReportsHubNavigator locale={activeLocale} />

      {/* Enterprise Management Intelligence Dashboard */}
      <EnterpriseReportsDashboard
        locale={activeLocale}
        isAdmin={isAdmin}
        userDepartmentId={principal?.departmentId ?? null}
        userDepartmentName={userDepartmentName}
        departments={departments}
        departmentsPerformance={departmentsPerformance ?? []}
        complaintsAnalytics={complaintsAnalytics}
        complaintsRecords={complaintsRecords?.items ?? []}
        ticketsAnalytics={ticketsAnalytics}
        ticketsRecords={ticketsRecords?.items ?? []}
      />
    </div>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

import React from 'react';
import { headers } from 'next/headers';
import { resolveLocale } from '../../../i18n/staff-shell';
import { getAssignableStaff } from '../../../lib/staff-assignable-staff-api';
import { getComplaintFormOptions } from '../../../lib/staff-complaint-form-options-api';
import {
  getStaffReportCatalogLoadResult,
  getStaffReportKpisLoadResult,
  getStaffReportRowsLoadResult,
} from '../../../lib/staff-reports-api';
import { getStaffSessionPrincipal } from '../../../lib/staff-session-api';
import {
  fetchComplaintsAnalytics,
  fetchComplaintsRecords,
  fetchTicketsAnalytics,
  fetchTicketsRecords,
} from '../../../lib/staff-reports-analytics-api';
import { fetchDepartmentPerformance } from '../../../lib/staff-reports-departments-api';
import { EnterpriseReportsDashboard } from '../../../components/reports/enterprise-reports-dashboard';
import { ReportsDashboard } from '../../../components/reports-dashboard';

type SearchParams = {
  locale?: string | string[];
  branchId?: string | string[];
  categoryId?: string | string[];
  dateFrom?: string | string[];
  dateTo?: string | string[];
  departmentId?: string | string[];
  ownerId?: string | string[];
  severity?: string | string[];
};

export default async function ReportsPage({
  searchParams,
  cookieHeader: propCookieHeader,
  fetchImpl,
}: {
  searchParams?: Promise<SearchParams>;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
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
  const apiInput = {
    cookieHeader,
    apiUrl,
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  };

  const filters = {
    branchId: readParam(params?.branchId) ?? '',
    categoryId: readParam(params?.categoryId) ?? '',
    dateFrom: readParam(params?.dateFrom) ?? '',
    dateTo: readParam(params?.dateTo) ?? '',
    departmentId: readParam(params?.departmentId) ?? '',
    ownerId: readParam(params?.ownerId) ?? '',
    severity: readParam(params?.severity) ?? '',
  };

  const [
    rows,
    kpis,
    catalog,
    options,
    staff,
    principal,
    departmentsPerformance,
    complaintsAnalytics,
    complaintsRecords,
    ticketsAnalytics,
    ticketsRecords,
  ] = await Promise.all([
    getStaffReportRowsLoadResult({ ...apiInput, filters }),
    getStaffReportKpisLoadResult({
      ...apiInput,
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
    }),
    getStaffReportCatalogLoadResult(apiInput),
    getComplaintFormOptions(apiInput),
    getAssignableStaff(apiInput),
    getStaffSessionPrincipal(apiInput),
    fetchDepartmentPerformance({}, cookieHeader, apiUrl),
    fetchComplaintsAnalytics({}, cookieHeader, apiUrl),
    fetchComplaintsRecords({}, 50, 0, cookieHeader, apiUrl),
    fetchTicketsAnalytics({}, cookieHeader, apiUrl),
    fetchTicketsRecords({}, 50, 0, cookieHeader, apiUrl),
  ]);

  const loadState = [rows, kpis, catalog].some((item) => item.status === 'denied')
    ? 'denied'
    : [rows, kpis, catalog].some((item) => item.status === 'error')
    ? 'error'
    : undefined;

  const activeLocale = resolveLocale(readParam(params?.locale));
  const isRtl = activeLocale === 'ar';
  const isAdmin = principal?.roleCode === 'ADMIN';

  const departments = (options?.departments ?? []).map((d) => ({
    id: d.id,
    name: isRtl ? d.nameAr : d.nameEn,
    nameEn: d.nameEn,
    nameAr: d.nameAr,
  }));

  const branches = (options?.branches ?? []).map((b) => ({
    id: b.id,
    name: isRtl ? b.nameAr : b.nameEn,
    nameEn: b.nameEn,
    nameAr: b.nameAr,
  }));

  const userDept = (options?.departments ?? []).find(
    (d) => d.id === principal?.departmentId,
  );
  const userDepartmentName = userDept ? (isRtl ? userDept.nameAr : userDept.nameEn) : null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 px-4 py-4 sm:px-6 lg:px-8 min-w-0 overflow-x-hidden">
      {/* Enterprise Management Intelligence Dashboard */}
      <EnterpriseReportsDashboard
        locale={activeLocale}
        isAdmin={isAdmin}
        userDepartmentId={principal?.departmentId ?? null}
        userDepartmentName={userDepartmentName}
        departments={departments}
        branches={branches}
        departmentsPerformance={departmentsPerformance ?? []}
        complaintsAnalytics={complaintsAnalytics}
        complaintsRecords={complaintsRecords?.items ?? []}
        ticketsAnalytics={ticketsAnalytics}
        ticketsRecords={ticketsRecords?.items ?? []}
      />

      {/* Regulatory Delivery Matrix & Compliance Audits */}
      <div className="pt-6 border-t">
        <ReportsDashboard
          canExport={Boolean(
            principal?.permissions.includes('REPORT_EXPORT') ||
            principal?.roleCode === 'ADMIN' ||
            principal?.roleCode === 'CR_MANAGER' ||
            principal?.roleCode === 'BRANCH_MANAGER',
          )}
          catalog={catalog.status === 'ready' ? catalog.data : undefined}
          filters={filters}
          kpis={kpis.status === 'ready' ? kpis.data : undefined}
          locale={activeLocale}
          options={options}
          rows={rows.status === 'ready' ? rows.data : undefined}
          staff={staff}
          state={loadState}
        />
      </div>
    </div>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

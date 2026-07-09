import React from 'react';
import { ReportsDashboard } from '../../../components/reports-dashboard';
import { resolveLocale } from '../../../i18n/staff-shell';
import { getAssignableStaff } from '../../../lib/staff-assignable-staff-api';
import { getComplaintFormOptions } from '../../../lib/staff-complaint-form-options-api';
import { getStaffReportCatalogLoadResult, getStaffReportKpisLoadResult, getStaffReportRowsLoadResult } from '../../../lib/staff-reports-api';
import { getStaffSessionPrincipal } from '../../../lib/staff-session-api';

type SearchParams = { locale?: string | string[]; branchId?: string | string[]; categoryId?: string | string[]; dateFrom?: string | string[]; dateTo?: string | string[]; departmentId?: string | string[]; ownerId?: string | string[]; severity?: string | string[] };

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
  const filters = {
    branchId: readParam(params?.branchId) ?? '',
    categoryId: readParam(params?.categoryId) ?? '',
    dateFrom: readParam(params?.dateFrom) ?? '',
    dateTo: readParam(params?.dateTo) ?? '',
    departmentId: readParam(params?.departmentId) ?? '',
    ownerId: readParam(params?.ownerId) ?? '',
    severity: readParam(params?.severity) ?? '',
  };
  const [rows, kpis, catalog, options, staff, principal] = await Promise.all([
    getStaffReportRowsLoadResult({ ...apiInput, filters }),
    getStaffReportKpisLoadResult(apiInput),
    getStaffReportCatalogLoadResult(apiInput),
    getComplaintFormOptions(apiInput),
    getAssignableStaff(apiInput),
    getStaffSessionPrincipal(apiInput),
  ]);
  const loadState = [rows, kpis, catalog].some((item) => item.status === 'denied') ? 'denied' : [rows, kpis, catalog].some((item) => item.status === 'error') ? 'error' : undefined;
  return (
    <ReportsDashboard
      canExport={principal?.permissions.includes('REPORT_EXPORT') ?? false}
      catalog={catalog.status === 'ready' ? catalog.data : undefined}
      filters={filters}
      kpis={kpis.status === 'ready' ? kpis.data : undefined}
      locale={resolveLocale(readParam(params?.locale))}
      options={options}
      rows={rows.status === 'ready' ? rows.data : undefined}
      staff={staff}
      state={loadState}
    />
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

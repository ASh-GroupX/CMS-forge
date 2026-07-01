import React from 'react';
import { ReportsDashboard, type ReportsPreviewState } from '../../../components/reports-dashboard';
import { resolveLocale } from '../../../i18n/staff-shell';
import { getAssignableStaff } from '../../../lib/staff-assignable-staff-api';
import { getComplaintFormOptions } from '../../../lib/staff-complaint-form-options-api';
import { getStaffReportCatalog, getStaffReportKpis, getStaffReportRows } from '../../../lib/staff-reports-api';

type SearchParams = { locale?: string | string[]; reports?: string | string[]; branchId?: string | string[]; categoryId?: string | string[]; dateFrom?: string | string[]; dateTo?: string | string[]; departmentId?: string | string[]; ownerId?: string | string[]; severity?: string | string[] };

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
  const [rows, kpis, catalog, options, staff] = await Promise.all([
    getStaffReportRows({ ...apiInput, filters }),
    getStaffReportKpis(apiInput),
    getStaffReportCatalog(apiInput),
    getComplaintFormOptions(apiInput),
    getAssignableStaff(apiInput),
  ]);
  return (
    <ReportsDashboard
      catalog={catalog ?? undefined}
      filters={filters}
      kpis={kpis ?? undefined}
      locale={resolveLocale(readParam(params?.locale))}
      options={options}
      rows={rows ?? undefined}
      staff={staff}
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

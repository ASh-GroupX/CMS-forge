import React from 'react';
import { headers } from 'next/headers';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getComplaintFormOptions } from '../../../../lib/staff-complaint-form-options-api';
import { getAssignableStaff } from '../../../../lib/staff-assignable-staff-api';
import {
  fetchComplaintsAnalytics,
  fetchComplaintsRecords,
} from '../../../../lib/staff-reports-analytics-api';
import { ComplaintsWorkspace } from '../../../../components/reports/complaints-workspace';

type SearchParams = { locale?: string | string[] };

export default async function ComplaintsReportPage({
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

  const [options, initialAnalytics, initialRecords, staff] = await Promise.all([
    getComplaintFormOptions({ cookieHeader, apiUrl }),
    fetchComplaintsAnalytics({}, cookieHeader, apiUrl),
    fetchComplaintsRecords({}, 15, 0, cookieHeader, apiUrl),
    getAssignableStaff({ cookieHeader, apiUrl }),
  ]);

  const rawLocale = Array.isArray(params?.locale) ? params?.locale[0] : params?.locale;
  const locale = resolveLocale(rawLocale);

  const departments = (options?.departments ?? []).map((d) => ({
    id: d.id,
    name: locale === 'ar' ? d.nameAr : d.nameEn,
  }));

  const categories = (options?.categories ?? []).map((c) => ({
    id: c.id,
    name: locale === 'ar' ? c.nameAr : c.nameEn,
  }));

  const initialOfficers = (staff ?? []).map((s) => ({
    id: s.userId,
    name: locale === 'ar' ? s.displayNameAr : s.displayName,
  }));

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <ComplaintsWorkspace
        locale={locale}
        initialDepartments={departments}
        initialCategories={categories}
        initialOfficers={initialOfficers}
        initialAnalytics={initialAnalytics}
        initialRecords={initialRecords}
      />
    </div>
  );
}

import React from 'react';
import { headers } from 'next/headers';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getComplaintFormOptions } from '../../../../lib/staff-complaint-form-options-api';
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
  if (!cookieHeader) {
    const requestHeaders = await headers();
    cookieHeader = requestHeaders.get('cookie') ?? '';
  }

  const options = await getComplaintFormOptions({
    cookieHeader,
    apiUrl: process.env.API_URL ?? 'http://localhost:3000',
  });

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

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <ComplaintsWorkspace
        locale={locale}
        initialDepartments={departments}
        initialCategories={categories}
      />
    </div>
  );
}

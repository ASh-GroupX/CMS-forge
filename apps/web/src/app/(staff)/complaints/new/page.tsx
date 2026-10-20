import React from 'react';
import { ComplaintIntakeWorkspace } from '../../../../components/complaint-intake-workspace';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getComplaintFormOptions } from '../../../../lib/staff-complaint-form-options-api';
import { getStaffSessionPrincipal } from '../../../../lib/staff-session-api';
import { headers } from 'next/headers';

type SearchParams = {
  locale?: string | string[];
  customerPhone?: string | string[];
  relatedTo?: string | string[];
};

export default async function NewComplaintPage({
  cookieHeader,
  fetchImpl,
  searchParams,
}: {
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  let finalCookie = cookieHeader;
  if (!finalCookie) {
    try {
      const requestHeaders = await headers();
      finalCookie = requestHeaders.get('cookie') ?? '';
    } catch {
      finalCookie = '';
    }
  }
  const locale = resolveLocale(readParam(params?.locale));
  const options = await getComplaintFormOptions({
    cookieHeader: finalCookie,
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  });
  
  const customerPhone = readParam(params?.customerPhone);
  const relatedTo = readParam(params?.relatedTo);
  
  const principal = await getStaffSessionPrincipal({
    cookieHeader: finalCookie,
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  });
  const canEditIncidentDate = principal?.roleCode === 'ADMIN' || principal?.roleCode === 'CR_MANAGER' || principal?.roleCode === 'BRANCH_MANAGER';

  return (
    <main className="grid gap-4">
      <ComplaintIntakeWorkspace locale={locale} options={options} defaultPhone={customerPhone} relatedTo={relatedTo} canEditIncidentDate={canEditIncidentDate} />
    </main>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

import { cookies } from 'next/headers';
import React from 'react';
import { AdminStandardProblems } from '../../../../components/admin-standard-problems';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getComplaintFormOptions } from '../../../../lib/staff-complaint-form-options-api';

type SearchParams = { locale?: string | string[] };

export default async function AdminStandardProblemsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  
  const options = await getComplaintFormOptions({ cookieHeader });
  
  // We need CSRF token for the API calls
  const csrfToken = cookieStore.get('cms_csrf_token')?.value || '';

  return (
    <AdminStandardProblems
      locale={resolveLocale(readParam(params?.locale))}
      options={options}
      csrfToken={csrfToken}
    />
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

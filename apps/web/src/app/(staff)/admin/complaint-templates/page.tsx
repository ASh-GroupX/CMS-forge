import { cookies } from 'next/headers';
import React from 'react';
import { AdminComplaintTemplates } from '../../../../components/admin-complaint-templates';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getComplaintFormOptions } from '../../../../lib/staff-complaint-form-options-api';

type SearchParams = { locale?: string | string[] };

export default async function AdminComplaintTemplatesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  
  const options = await getComplaintFormOptions({ cookieHeader });
  const csrfToken = cookieStore.get('cms_csrf_token')?.value || '';

  return (
    <AdminComplaintTemplates
      locale={resolveLocale(readParam(params?.locale))}
      options={options}
      csrfToken={csrfToken}
    />
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

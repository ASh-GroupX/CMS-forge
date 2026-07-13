import React from 'react';
import { ComplaintIntakeWorkspace } from '../../../../components/complaint-intake-workspace';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getComplaintFormOptions } from '../../../../lib/staff-complaint-form-options-api';

type SearchParams = {
  locale?: string | string[];
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
  const locale = resolveLocale(readParam(params?.locale));
  const options = await getComplaintFormOptions({
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  });
  return (
    <main className="grid gap-4">
      <ComplaintIntakeWorkspace locale={locale} options={options} />
    </main>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

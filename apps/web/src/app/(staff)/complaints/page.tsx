import React from 'react';
import { resolveLocale } from '../../../i18n/staff-shell';
import { getStaffQueueItems } from '../../../lib/staff-queue-api';
import { WorkQueue } from '../../../components/work-queue';

type SearchParams = { locale?: string | string[] };

export default async function ComplaintsPage({
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
  const apiInput = {
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  };
  const rows = await getStaffQueueItems(apiInput);
  return <WorkQueue locale={locale} rows={rows} />;
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

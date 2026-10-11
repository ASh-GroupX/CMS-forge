import React from 'react';
import { headers } from 'next/headers';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { WorkQueue } from '../../../../components/work-queue';
import { getStaffQueueLoadResult } from '../../../../lib/staff-queue-api';

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  cookieHeader?: string;
  locale?: 'en' | 'ar';
  fetchImpl?: typeof fetch;
};

export default async function ComplaintsPage({ searchParams, cookieHeader: propCookieHeader, locale: propLocale, fetchImpl }: PageProps) {
  let cookieHeader = propCookieHeader;
  let locale = propLocale;
  
  if (!cookieHeader) {
    const requestHeaders = await headers();
    locale = locale || resolveLocale(requestHeaders.get('x-cms-locale') ?? undefined);
    cookieHeader = requestHeaders.get('cookie') ?? '';
  } else {
    locale = locale || resolveLocale(undefined);
  }
  
  const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
  
  const params = await searchParams;
  
  const query: any = {};
  if (typeof params?.search === 'string') query.search = params.search;
  if (typeof params?.status === 'string') query.status = params.status;
  if (typeof params?.severity === 'string') query.severity = params.severity;
  if (typeof params?.sla === 'string') query.sla = params.sla;
  if (typeof params?.ownerScope === 'string') query.ownerScope = params.ownerScope;
  if (typeof params?.page === 'string') query.page = parseInt(params.page, 10);
  if (typeof params?.branchId === 'string') query.branchId = params.branchId;

  const queueResult = await getStaffQueueLoadResult({ apiUrl, cookieHeader, query, ...(fetchImpl !== undefined ? { fetchImpl } : {}) });
  const rows = queueResult.status === 'ready' ? queueResult.data?.rows : undefined;
  const state = queueResult.status === 'error' ? 'error' : undefined;
  const queue = queueResult.status === 'ready' ? queueResult.data : undefined;

  return (
    <div className="flex h-full flex-col overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <WorkQueue locale={locale} rows={rows ?? null} state={state} query={query} queue={queue ?? null} />
    </div>
  );
}

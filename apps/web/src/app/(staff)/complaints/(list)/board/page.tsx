import React from 'react';
import { headers } from 'next/headers';
import { ComplaintBoardScreen } from '../../../../../components/complaint-board';
import { resolveLocale } from '../../../../../i18n/staff-shell';
import { getAssignableStaff } from '../../../../../lib/staff-assignable-staff-api';
import { getComplaintBoardLoadResult } from '../../../../../lib/staff-complaint-board-api';
import { getComplaintFormOptions } from '../../../../../lib/staff-complaint-form-options-api';
import { complaintCardDetailAction, transitionComplaintAction } from './actions';

type SearchParams = { locale?: string | string[] };

export default async function ComplaintBoardPage({
  cookieHeader: propCookieHeader,
  locale: propLocale,
  fetchImpl,
  searchParams,
}: {
  cookieHeader?: string;
  locale?: 'en' | 'ar';
  fetchImpl?: typeof fetch;
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  let cookieHeader = propCookieHeader;
  let locale = propLocale;

  if (!cookieHeader) {
    const requestHeaders = await headers();
    locale = locale || resolveLocale(params?.locale || (requestHeaders.get('x-cms-locale') ?? undefined));
    cookieHeader = requestHeaders.get('cookie') ?? '';
  } else {
    locale = locale || resolveLocale(params?.locale);
  }

  const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
  const apiInput = {
    apiUrl,
    cookieHeader,
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  };
  const result = await getComplaintBoardLoadResult(apiInput);
  const [options, staff] = result.status === 'ready'
    ? await Promise.all([getComplaintFormOptions(apiInput), getAssignableStaff(apiInput)])
    : [null, null];
  return (
    <ComplaintBoardScreen
      board={result.status === 'ready' ? result.data : null}
      detailAction={complaintCardDetailAction}
      locale={locale}
      options={options}
      staff={staff}
      state={result.status === 'ready' ? undefined : result.status}
      transitionAction={transitionComplaintAction}
    />
  );
}

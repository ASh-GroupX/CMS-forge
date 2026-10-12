import React from 'react';
import { resolveLocale } from '../../../../../i18n/staff-shell';
import { getComplaintBoardByBranchLoadResult, getComplaintBoardByCategoryLoadResult, getComplaintBoardByDepartmentLoadResult, getComplaintBoardLoadResult } from '../../../../../lib/staff-complaint-board-api';
import { OperationsBoardScreen } from '../../../../../components/operations-board';

import { headers } from 'next/headers';

type SearchParams = { locale?: string | string[]; view?: string | string[] };

export default async function OperationsPage({
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
    locale = locale || resolveLocale(readParam(params?.locale) || (requestHeaders.get('x-cms-locale') ?? undefined));
    cookieHeader = requestHeaders.get('cookie') ?? '';
  } else {
    locale = locale || resolveLocale(readParam(params?.locale));
  }

  const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
  const viewParam = readParam(params?.view);
  const viewMode = viewParam === 'branch' ? 'branch' : viewParam === 'category' ? 'category' : viewParam === 'department' ? 'department' : 'stage';

  const requestOptions = {
    apiUrl,
    cookieHeader,
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  };

  const boardResult = viewMode === 'branch'
    ? await getComplaintBoardByBranchLoadResult(requestOptions)
    : viewMode === 'category'
      ? await getComplaintBoardByCategoryLoadResult(requestOptions)
      : viewMode === 'department'
        ? await getComplaintBoardByDepartmentLoadResult(requestOptions)
        : await getComplaintBoardLoadResult(requestOptions);

  const board = boardResult.status === 'ready' ? boardResult.data : null;
  const state = boardResult.status === 'ready' ? undefined : boardResult.status;

  return (
    <OperationsBoardScreen
      board={board}
      initialView={viewMode}
      locale={locale}
      {...(state ? { state } : {})}
    />
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

import React from 'react';
import { resolveLocale } from '../../../../../i18n/staff-shell';
import { getComplaintBoardByBranchLoadResult, getComplaintBoardByCategoryLoadResult, getComplaintBoardByDepartmentLoadResult, getComplaintBoardLoadResult } from '../../../../../lib/staff-complaint-board-api';
import { OperationsBoardScreen } from '../../../../../components/operations-board';

type SearchParams = { locale?: string | string[]; view?: string | string[] };

export default async function OperationsPage({
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
  const viewParam = readParam(params?.view);
  const viewMode = viewParam === 'branch' ? 'branch' : viewParam === 'category' ? 'category' : viewParam === 'department' ? 'department' : 'stage';

  const requestOptions = {
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
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

import React from 'react';
import { ComplaintBoardScreen } from '../../../../components/complaint-board';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getAssignableStaff } from '../../../../lib/staff-assignable-staff-api';
import { getComplaintBoardLoadResult } from '../../../../lib/staff-complaint-board-api';
import { getComplaintFormOptions } from '../../../../lib/staff-complaint-form-options-api';
import { complaintCardDetailAction, transitionComplaintAction } from './actions';

type SearchParams = { locale?: string | string[] };

export default async function ComplaintBoardPage({
  cookieHeader,
  fetchImpl,
  searchParams,
}: {
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params?.locale);
  const apiInput = {
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  };
  const result = await getComplaintBoardLoadResult(apiInput);
  // Transition fields (routing branch/department, owner) reuse the same option and
  // staff catalogs as the complaint detail workflow — loaded only when the board is.
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

import React from 'react';
import { TaskBoardScreen } from '../../../../components/task-board';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getTaskBoardLoadResult } from '../../../../lib/staff-board-api';
import { moveTaskCardAction } from './actions';

type SearchParams = { locale?: string | string[] };

export default async function TaskBoardPage({
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
  const result = await getTaskBoardLoadResult({
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  });
  return (
    <TaskBoardScreen
      board={result.status === 'ready' ? result.data : null}
      locale={locale}
      moveAction={moveTaskCardAction}
      state={result.status === 'ready' ? undefined : result.status}
    />
  );
}

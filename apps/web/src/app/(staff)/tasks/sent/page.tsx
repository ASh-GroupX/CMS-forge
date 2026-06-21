import React from 'react';
import { SentTasks } from '../../../../components/sent-tasks';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getSentTasks } from '../../../../lib/staff-sent-tasks-api';
import { commentOnTaskAction, nudgeTaskAction } from './actions';

type SearchParams = { locale?: string | string[]; task?: string | string[] };

export default async function SentTasksPage({
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
  const data = await getSentTasks({
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  });
  return <SentTasks commentAction={commentOnTaskAction} data={data} locale={locale} nudgeAction={nudgeTaskAction} {...resultProp(readResult(params?.task))} />;
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readResult(value: string | string[] | undefined): 'error' | 'success' | undefined {
  const result = readParam(value);
  return result === 'success' || result === 'error' ? result : undefined;
}

function resultProp(result: 'error' | 'success' | undefined) {
  return result ? { result } : {};
}

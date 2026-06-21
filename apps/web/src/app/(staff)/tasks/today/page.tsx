import React from 'react';
import { EmployeeToday } from '../../../../components/employee-today';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getEmployeeTodayTasks } from '../../../../lib/staff-tasks-api';
import { quickAddTaskAction, updateTaskAction } from './actions';

type SearchParams = { locale?: string | string[]; task?: string | string[] };

export default async function EmployeeTodayPage({
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
  const data = await getEmployeeTodayTasks(apiInput);
  return <EmployeeToday locale={locale} data={data} quickAddAction={quickAddTaskAction} result={readResult(params?.task)} updateAction={updateTaskAction} />;
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readResult(value: string | string[] | undefined): 'error' | 'link-required' | 'success' | undefined {
  const result = readParam(value);
  return result === 'success' || result === 'error' || result === 'link-required' ? result : undefined;
}

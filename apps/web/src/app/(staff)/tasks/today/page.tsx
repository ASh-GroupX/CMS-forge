import React from 'react';
import { EmployeeToday } from '../../../../components/employee-today';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getAssignableStaff } from '../../../../lib/staff-assignable-staff-api';
import { getStaffAssignmentOptions } from '../../../../lib/staff-assignment-options-api';
import { getEmployeeTodayTasksLoadResult } from '../../../../lib/staff-tasks-api';
import { getStaffSessionPrincipal } from '../../../../lib/staff-session-api';
import { loadRelatedRecordsAction, quickAddTaskAction, updateTaskAction } from './actions';

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
  const [data, staff, principal, assignmentOptions] = await Promise.all([getEmployeeTodayTasksLoadResult(apiInput), getAssignableStaff(apiInput), getStaffSessionPrincipal(apiInput), getStaffAssignmentOptions(apiInput)]);
  return <EmployeeToday assignmentOptions={assignmentOptions} locale={locale} data={data.status === 'ready' ? data.data : null} loadRelatedRecordsAction={loadRelatedRecordsAction} staff={staff} quickAddAction={quickAddTaskAction} result={readResult(params?.task)} state={data.status === 'ready' ? undefined : data.status} timeZone={principal?.branchTimezone ?? 'UTC'} updateAction={updateTaskAction} />;
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readResult(value: string | string[] | undefined): 'denied' | 'error' | 'link-required' | 'success' | undefined {
  const result = readParam(value);
  return result === 'success' || result === 'error' || result === 'denied' || result === 'link-required' ? result : undefined;
}

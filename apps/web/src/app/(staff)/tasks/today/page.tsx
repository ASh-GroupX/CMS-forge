import React from 'react';
import { EmployeeToday } from '../../../../components/employee-today';
import { resolveLocale } from '../../../../i18n/staff-shell';
import { getAssignableStaff } from '../../../../lib/staff-assignable-staff-api';
import { getStaffAssignmentOptions } from '../../../../lib/staff-assignment-options-api';
import { getEmployeeTodayTasksLoadResult, type StaffTask } from '../../../../lib/staff-tasks-api';
import { getStaffSessionPrincipal, resolveUserDashboardCapabilities } from '../../../../lib/staff-session-api';
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
  const [data, staff, principal, assignmentOptions] = await Promise.all([
    getEmployeeTodayTasksLoadResult(apiInput),
    getAssignableStaff(apiInput),
    getStaffSessionPrincipal(apiInput),
    getStaffAssignmentOptions(apiInput),
  ]);
  const { isInternalOnly } = resolveUserDashboardCapabilities(principal);
  let tasksData = data.status === 'ready' ? data.data : null;
  if (tasksData && isInternalOnly) {
    const isNotCrm = (t: StaffTask) =>
      !t.isCustomerPromise &&
      !t.links?.some((l) => ['complaint', 'customer', 'deal', 'case'].includes(l.entityType?.toLowerCase()));
    tasksData = {
      completed: tasksData.completed.filter(isNotCrm),
      dueToday: tasksData.dueToday.filter(isNotCrm),
      overdue: tasksData.overdue.filter(isNotCrm),
      overduePromises: [],
      assignedToMe: tasksData.assignedToMe.filter(isNotCrm),
      waitingOnMe: tasksData.waitingOnMe.filter(isNotCrm),
    };
  }
  return (
    <EmployeeToday
      assignmentOptions={assignmentOptions}
      data={tasksData}
      loadRelatedRecordsAction={loadRelatedRecordsAction}
      locale={locale}
      quickAddAction={quickAddTaskAction}
      result={readResult(params?.task)}
      staff={staff}
      state={data.status === 'ready' ? undefined : data.status}
      timeZone={principal?.branchTimezone ?? 'UTC'}
      updateAction={updateTaskAction}
    />
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readResult(value: string | string[] | undefined): 'denied' | 'error' | 'link-required' | 'success' | undefined {
  const result = readParam(value);
  return result === 'success' || result === 'error' || result === 'denied' || result === 'link-required' ? result : undefined;
}

import React from 'react';
import { DashboardSummary } from '../../../components/dashboard-summary';
import { resolveLocale } from '../../../i18n/staff-shell';
import { getStaffDashboardSummary } from '../../../lib/staff-dashboard-api';
import { getStaffNotifications } from '../../../lib/staff-notifications-api';
import { getStaffSessionPrincipal } from '../../../lib/staff-session-api';
import { getEmployeeTodayTasks, getManagerControlRoomTasks } from '../../../lib/staff-tasks-api';

type SearchParams = { locale?: string | string[] };

export default async function DashboardPage({
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
  const principal = await getStaffSessionPrincipal(apiInput);
  const canViewReports = principal?.permissions.includes('REPORT_VIEW') ?? false;
  const [data, tasks, notifications, manager] = await Promise.all([
    getStaffDashboardSummary(apiInput),
    getEmployeeTodayTasks(apiInput),
    getStaffNotifications({ ...apiInput, limit: 8 }),
    canViewReports ? getManagerControlRoomTasks(apiInput) : Promise.resolve(null),
  ]);
  return <DashboardSummary data={data} locale={locale} manager={manager} notifications={notifications} principal={principal} tasks={tasks} />;
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

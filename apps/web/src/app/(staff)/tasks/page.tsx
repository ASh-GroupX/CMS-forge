import React from 'react';
import { headers } from 'next/headers';
import { resolveLocale } from '../../../i18n/staff-shell';
import { myWorkText } from '../../../i18n/staff-my-work';
import { getEmployeeTodayTasksLoadResult, type EmployeeTodayTasks } from '../../../lib/staff-tasks-api';
import { getStaffSessionPrincipal } from '../../../lib/staff-session-api';
import { getStaffQueueLoadResult } from '../../../lib/staff-queue-api';
import { mergeWorkItems } from '../../../lib/staff-tasks-aggregate';
import { MyWorkDashboard } from '../../../components/tasks/my-work-dashboard';

type SearchParams = { locale?: string | string[] };

export default async function TasksPage({
  searchParams,
  cookieHeader: propCookieHeader,
  fetchImpl: propFetchImpl,
}: {
  searchParams?: Promise<SearchParams>;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
}) {
  const params = await searchParams;
  const locale = resolveLocale(readParam(params?.locale));
  const t = myWorkText[locale];

  let cookieHeader = propCookieHeader;
  if (!cookieHeader) {
    try {
      const requestHeaders = await headers();
      cookieHeader = requestHeaders.get('cookie') ?? '';
    } catch {
      cookieHeader = '';
    }
  }

  const fetchImpl = propFetchImpl ?? fetch;
  const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
  const requestOptions = {
    cookieHeader,
    fetchImpl,
  };

  const [tasksResult, principal, queueResult, meComplaintsResult, tickets] = await Promise.all([
    getEmployeeTodayTasksLoadResult(requestOptions).catch(() => ({ status: 'error' as const })),
    getStaffSessionPrincipal(requestOptions).catch(() => null),
    getStaffQueueLoadResult({ apiUrl, cookieHeader, query: { pageSize: 50 }, fetchImpl }).catch(() => null),
    getStaffQueueLoadResult({ apiUrl, cookieHeader, query: { ownerScope: 'ME', pageSize: 50 }, fetchImpl }).catch(() => null),
    fetchInternalTickets(apiUrl, cookieHeader, fetchImpl),
  ]);

  if (tasksResult.status !== 'ready' && !tickets.length && (!queueResult || queueResult.status !== 'ready') && (!meComplaintsResult || meComplaintsResult.status !== 'ready')) {
    if (!principal) {
      return (
        <div className="grid min-h-[50vh] place-items-center">
          <p className="text-content-muted">{t.states.denied}</p>
        </div>
      );
    }
  }

  const baseTasks: EmployeeTodayTasks = tasksResult.status === 'ready' ? tasksResult.data : {
    completed: [],
    dueToday: [],
    overdue: [],
    overduePromises: [],
    assignedToMe: [],
    waitingOnMe: [],
  };

  const complaintMap = new Map<string, any>();
  if (queueResult?.status === 'ready' && Array.isArray(queueResult.data?.rows)) {
    for (const c of queueResult.data.rows) complaintMap.set(c.id, c);
  }
  if (meComplaintsResult?.status === 'ready' && Array.isArray(meComplaintsResult.data?.rows)) {
    for (const c of meComplaintsResult.data.rows) complaintMap.set(c.id, c);
  }
  const assignedComplaints = Array.from(complaintMap.values());

  let allTickets = tickets;
  if (principal?.departmentId && (principal.roleCode === 'BRANCH_MANAGER' || principal.roleCode === 'DEPARTMENT_MANGER' || principal.roleCode === 'CR_MANAGER')) {
    const deptTickets = await fetchDepartmentTickets(principal.departmentId, apiUrl, cookieHeader, fetchImpl);
    const map = new Map<string, any>();
    for (const item of allTickets) map.set(item.id, item);
    for (const item of deptTickets) map.set(item.id, item);
    allTickets = Array.from(map.values());
  }

  const aggregatedData = mergeWorkItems(baseTasks, allTickets, assignedComplaints);

  return (
    <>
      <header className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-content-strong">{t.title}</h1>
        <p className="text-sm text-content-muted">{t.subtitle}</p>
      </header>
      <MyWorkDashboard data={aggregatedData} locale={locale} t={t} />
    </>
  );
}

async function fetchInternalTickets(apiUrl: string, cookieHeader: string, fetchImpl: typeof fetch): Promise<any[]> {
  try {
    const res = await fetchImpl(new URL('/internal-tickets', apiUrl), {
      headers: { Accept: 'application/json', cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return (await res.json()) as any[];
  } catch {
    return [];
  }
}

async function fetchDepartmentTickets(departmentId: string, apiUrl: string, cookieHeader: string, fetchImpl: typeof fetch): Promise<any[]> {
  try {
    const res = await fetchImpl(new URL(`/internal-tickets/department/${encodeURIComponent(departmentId)}`, apiUrl), {
      headers: { Accept: 'application/json', cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return (await res.json()) as any[];
  } catch {
    return [];
  }
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

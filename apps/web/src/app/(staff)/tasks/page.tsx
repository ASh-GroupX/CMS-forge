import React from 'react';
import { headers } from 'next/headers';
import { resolveLocale } from '../../../i18n/staff-shell';
import { myWorkText } from '../../../i18n/staff-my-work';
import { getEmployeeTodayTasksLoadResult, type EmployeeTodayTasks, type StaffTask } from '../../../lib/staff-tasks-api';
import { getStaffSessionPrincipal, resolveUserDashboardCapabilities } from '../../../lib/staff-session-api';
import { getStaffQueueLoadResult } from '../../../lib/staff-queue-api';
import { getTaskItemType, mergeWorkItems } from '../../../lib/staff-tasks-aggregate';
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

  const principal = await getStaffSessionPrincipal(requestOptions).catch(() => null);
  const { canSeeCrm, canSeeInternal, isInternalOnly, isCrmOnly } = resolveUserDashboardCapabilities(principal);

  const [tasksResult, queueResult, meComplaintsResult, tickets] = await Promise.all([
    getEmployeeTodayTasksLoadResult(requestOptions).catch(() => ({ status: 'error' as const })),
    canSeeCrm
      ? getStaffQueueLoadResult({ apiUrl, cookieHeader, query: { pageSize: 50 }, fetchImpl }).catch(() => null)
      : Promise.resolve(null),
    canSeeCrm
      ? getStaffQueueLoadResult({ apiUrl, cookieHeader, query: { ownerScope: 'ME', pageSize: 50 }, fetchImpl }).catch(() => null)
      : Promise.resolve(null),
    canSeeInternal
      ? fetchInternalTickets(apiUrl, cookieHeader, fetchImpl)
      : Promise.resolve([]),
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

  if (isInternalOnly) {
    const notComplaint = (item: StaffTask) => getTaskItemType(item) !== 'complaint';
    baseTasks.completed = baseTasks.completed.filter(notComplaint);
    baseTasks.dueToday = baseTasks.dueToday.filter(notComplaint);
    baseTasks.overdue = baseTasks.overdue.filter(notComplaint);
    baseTasks.assignedToMe = baseTasks.assignedToMe.filter(notComplaint);
    baseTasks.waitingOnMe = baseTasks.waitingOnMe.filter(notComplaint);
    baseTasks.overduePromises = [];
  } else if (isCrmOnly) {
    const notTicket = (item: StaffTask) => getTaskItemType(item) !== 'ticket';
    baseTasks.completed = baseTasks.completed.filter(notTicket);
    baseTasks.dueToday = baseTasks.dueToday.filter(notTicket);
    baseTasks.overdue = baseTasks.overdue.filter(notTicket);
    baseTasks.assignedToMe = baseTasks.assignedToMe.filter(notTicket);
    baseTasks.waitingOnMe = baseTasks.waitingOnMe.filter(notTicket);
  }

  const complaintMap = new Map<string, any>();
  if (canSeeCrm) {
    if (queueResult?.status === 'ready' && Array.isArray(queueResult.data?.rows)) {
      for (const c of queueResult.data.rows) complaintMap.set(c.id, c);
    }
    if (meComplaintsResult?.status === 'ready' && Array.isArray(meComplaintsResult.data?.rows)) {
      for (const c of meComplaintsResult.data.rows) complaintMap.set(c.id, c);
    }
  }
  const assignedComplaints = Array.from(complaintMap.values());

  let allTickets = canSeeInternal ? tickets : [];
  if (canSeeInternal && principal?.departmentId && (principal.roleCode === 'BRANCH_MANAGER' || principal.roleCode === 'DEPARTMENT_MANGER' || principal.roleCode === 'CR_MANAGER')) {
    const deptTickets = await fetchDepartmentTickets(principal.departmentId, apiUrl, cookieHeader, fetchImpl);
    const map = new Map<string, any>();
    for (const item of allTickets) map.set(item.id, item);
    for (const item of deptTickets) map.set(item.id, item);
    allTickets = Array.from(map.values());
  }

  const aggregatedData = mergeWorkItems(baseTasks, allTickets, assignedComplaints);
  const isAdmin = principal?.roleCode === 'ADMIN' || Boolean(principal?.permissions?.includes('ADMIN_SYSTEM_CONFIG'));

  return (
    <>
      <header className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-content-strong">
          {isInternalOnly ? (locale === 'ar' ? 'مهام وتذاكر العمليات الداخلية' : 'Internal Operations & Tasks') : t.title}
        </h1>
        <p className="text-sm text-content-muted">
          {isInternalOnly ? (locale === 'ar' ? 'جميع التذاكر والمهام الداخلية المطلوبة منك، مصنفة حسب الأولوية والاستحقاق' : 'All internal tickets and tasks assigned to you, organized by priority') : t.subtitle}
        </p>
      </header>
      <MyWorkDashboard
        canSeeCrm={canSeeCrm}
        canSeeInternal={canSeeInternal}
        data={aggregatedData}
        isAdmin={isAdmin}
        locale={locale}
        t={t}
      />
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

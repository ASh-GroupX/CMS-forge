type TaskSectionKey = 'dueToday' | 'overdue' | 'overduePromises' | 'assignedToMe' | 'waitingOnMe';
type ManagerTaskSectionKey = 'dueToday' | 'overduePromises' | 'escalated';

export type StaffTaskStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'DONE';

export type StaffTask = {
  id: string;
  title: string;
  ownerId: string;
  assigneeId: string;
  dueAt: string;
  status: StaffTaskStatus;
  nextAction: { what: string; whoId: string; when: string } | null;
  isCustomerPromise: boolean;
  visibility: string;
  confidentialityLevel: string;
  links: { entityType: string; entityId: string }[];
  participantUserIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type EmployeeTodayTasks = Record<TaskSectionKey, StaffTask[]>;
export type ManagerRollupCount = { assigneeId: string; count: number };
export type ManagerStuckTask = StaffTask & { stuckReasons: ('NEXT_ACTION_OVERDUE' | 'NO_MOVEMENT')[] };
export type ManagerControlRoomTasks = Record<ManagerTaskSectionKey, StaffTask[]> & {
  overdueByEmployee: ManagerRollupCount[];
  stuck: ManagerStuckTask[];
  workloadByAssignee: ManagerRollupCount[];
  promiseKpi: { openPromiseCount: number; overduePromiseCount: number };
};

type EmployeeTodayBody = Partial<Record<TaskSectionKey, Partial<StaffTask>[]>>;
type ManagerControlRoomBody = Partial<Record<ManagerTaskSectionKey, Partial<StaffTask>[]>> & {
  overdueByEmployee?: Partial<ManagerRollupCount>[];
  stuck?: (Partial<StaffTask> & { stuckReasons?: unknown })[];
  workloadByAssignee?: Partial<ManagerRollupCount>[];
  promiseKpi?: Partial<ManagerControlRoomTasks['promiseKpi']>;
};

const STAFF_SESSION_COOKIE = 'cms_staff_session';
const TASK_SECTIONS: readonly TaskSectionKey[] = ['dueToday', 'overdue', 'overduePromises', 'assignedToMe', 'waitingOnMe'];

export async function getEmployeeTodayTasks({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<EmployeeTodayTasks | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const response = await fetchImpl(new URL('/tasks/today', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return null;
    return tasksFrom((await response.json()) as EmployeeTodayBody);
  } catch {
    return null;
  }
}

export async function getManagerControlRoomTasks({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<ManagerControlRoomTasks | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const response = await fetchImpl(new URL('/tasks/manager-rollup', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return null;
    return managerRollupFrom((await response.json()) as ManagerControlRoomBody);
  } catch {
    return null;
  }
}

function tasksFrom(body: EmployeeTodayBody): EmployeeTodayTasks | null {
  const result = {} as EmployeeTodayTasks;
  for (const section of TASK_SECTIONS) {
    if (!Array.isArray(body[section])) return null;
    const tasks = body[section].map(taskFrom);
    if (tasks.some((task) => task === null)) return null;
    result[section] = tasks as StaffTask[];
  }
  return result;
}

function managerRollupFrom(body: ManagerControlRoomBody): ManagerControlRoomTasks | null {
  if (!Array.isArray(body.overdueByEmployee) || !Array.isArray(body.stuck) || !Array.isArray(body.workloadByAssignee)) return null;
  const overdueByEmployee = countsFrom(body.overdueByEmployee);
  const stuck = stuckTasksFrom(body.stuck);
  const workloadByAssignee = countsFrom(body.workloadByAssignee);
  const promiseKpi = promiseKpiFrom(body.promiseKpi);
  if (!overdueByEmployee || !stuck || !workloadByAssignee || !promiseKpi) return null;
  const result = { overdueByEmployee, stuck, workloadByAssignee, promiseKpi } as ManagerControlRoomTasks;
  for (const section of ['dueToday', 'overduePromises', 'escalated'] as const) {
    if (!Array.isArray(body[section])) return null;
    const tasks = body[section].map(taskFrom);
    if (tasks.some((task) => task === null)) return null;
    result[section] = tasks as StaffTask[];
  }
  return result;
}

function countsFrom(rows: Partial<ManagerRollupCount>[]): ManagerRollupCount[] | null {
  const counts = rows.filter((row): row is ManagerRollupCount => typeof row.assigneeId === 'string' && typeof row.count === 'number');
  return counts.length === rows.length ? counts : null;
}

function stuckTasksFrom(rows: NonNullable<ManagerControlRoomBody['stuck']>): ManagerStuckTask[] | null {
  const tasks = rows.map((row) => {
    const task = taskFrom(row);
    const rawReasons = row.stuckReasons;
    if (!Array.isArray(rawReasons)) return null;
    const reasons = rawReasons.filter((reason): reason is ManagerStuckTask['stuckReasons'][number] => reason === 'NEXT_ACTION_OVERDUE' || reason === 'NO_MOVEMENT');
    return task && reasons.length === rawReasons.length ? { ...task, stuckReasons: reasons } : null;
  });
  return tasks.some((task) => task === null) ? null : tasks as ManagerStuckTask[];
}

function promiseKpiFrom(value: ManagerControlRoomBody['promiseKpi']): ManagerControlRoomTasks['promiseKpi'] | null {
  if (typeof value?.openPromiseCount !== 'number' || typeof value.overduePromiseCount !== 'number') return null;
  return { openPromiseCount: value.openPromiseCount, overduePromiseCount: value.overduePromiseCount };
}

function taskFrom(task: Partial<StaffTask>): StaffTask | null {
  if (
    typeof task.id !== 'string' ||
    typeof task.title !== 'string' ||
    typeof task.ownerId !== 'string' ||
    typeof task.assigneeId !== 'string' ||
    typeof task.dueAt !== 'string' ||
    !isTaskStatus(task.status) ||
    typeof task.isCustomerPromise !== 'boolean' ||
    typeof task.visibility !== 'string' ||
    typeof task.confidentialityLevel !== 'string' ||
    !Array.isArray(task.links) ||
    !Array.isArray(task.participantUserIds) ||
    typeof task.createdAt !== 'string' ||
    typeof task.updatedAt !== 'string'
  ) {
    return null;
  }

  const nextAction = nextActionFrom(task.nextAction);
  if (nextAction === false) return null;
  const links = linksFrom(task.links);
  if (!links) return null;
  const participantUserIds = task.participantUserIds.filter((id): id is string => typeof id === 'string');
  if (participantUserIds.length !== task.participantUserIds.length) return null;

  return {
    id: task.id,
    title: task.title,
    ownerId: task.ownerId,
    assigneeId: task.assigneeId,
    dueAt: task.dueAt,
    status: task.status,
    nextAction,
    isCustomerPromise: task.isCustomerPromise,
    visibility: task.visibility,
    confidentialityLevel: task.confidentialityLevel,
    links,
    participantUserIds,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function nextActionFrom(value: Partial<StaffTask['nextAction']> | null | undefined) {
  if (value === null || value === undefined) return null;
  if (typeof value.what !== 'string' || typeof value.whoId !== 'string' || typeof value.when !== 'string') return false;
  return { what: value.what, whoId: value.whoId, when: value.when };
}

function linksFrom(value: StaffTask['links']): StaffTask['links'] | null {
  const links = value.filter(
    (link): link is { entityType: string; entityId: string } =>
      typeof link?.entityType === 'string' && typeof link.entityId === 'string',
  );
  return links.length === value.length ? links : null;
}

function isTaskStatus(value: unknown): value is StaffTaskStatus {
  return value === 'OPEN' || value === 'IN_PROGRESS' || value === 'WAITING' || value === 'DONE';
}

function hasStaffSessionCookie(cookieHeader: string): boolean {
  return cookieHeader.split(';').some((cookie) => cookie.trim().startsWith(`${STAFF_SESSION_COOKIE}=`));
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    return (await cookies()).toString();
  } catch {
    return '';
  }
}

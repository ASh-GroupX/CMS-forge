import { CSRF_COOKIE, hasStaffSessionCookie, incomingCookieHeader, readCookie } from './staff-request-auth';

type TaskSectionKey = 'completed' | 'dueToday' | 'overdue' | 'overduePromises' | 'assignedToMe' | 'waitingOnMe';
type ManagerTaskSectionKey = 'dueToday' | 'overduePromises' | 'escalated';

export type StaffTaskStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'DONE';

export type StaffTask = {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string | null;
  assigneeId: string;
  assigneeName: string | null;
  branchId: string | null;
  branchName: string | null;
  displayTimeZone: string;
  dueAt: string;
  status: StaffTaskStatus;
  nextAction: { what: string; whoId: string; whoName: string | null; when: string } | null;
  isCustomerPromise: boolean;
  visibility: string;
  confidentialityLevel: string;
  links: { entityType: string; entityId: string }[];
  participantUserIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type EmployeeTodayTasks = Record<TaskSectionKey, StaffTask[]>;
export type ManagerRollupCount = { assigneeId: string; assigneeName?: string | null; count: number };
export type ManagerStuckTask = StaffTask & { stuckReasons: ('NEXT_ACTION_OVERDUE' | 'NO_MOVEMENT')[] };
export type ManagerControlRoomTasks = Record<ManagerTaskSectionKey, StaffTask[]> & {
  overdueByEmployee: ManagerRollupCount[];
  stuck: ManagerStuckTask[];
  workloadByAssignee: ManagerRollupCount[];
  promiseKpi: { openPromiseCount: number; overduePromiseCount: number };
};
export type StaffTaskLoadResult<T> = { status: 'ready'; data: T } | { status: 'denied' | 'error' };
export type StaffWriteResult = 'success' | 'denied' | 'error';

type EmployeeTodayBody = Partial<Record<TaskSectionKey, Partial<StaffTask>[]>>;
type ManagerControlRoomBody = Partial<Record<ManagerTaskSectionKey, Partial<StaffTask>[]>> & {
  overdueByEmployee?: Partial<ManagerRollupCount>[];
  stuck?: (Partial<StaffTask> & { stuckReasons?: unknown })[];
  workloadByAssignee?: Partial<ManagerRollupCount>[];
  promiseKpi?: Partial<ManagerControlRoomTasks['promiseKpi']>;
};

const TASK_SECTIONS: readonly TaskSectionKey[] = ['completed', 'dueToday', 'overdue', 'overduePromises', 'assignedToMe', 'waitingOnMe'];

export async function getEmployeeTodayTasks({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<EmployeeTodayTasks | null> {
  const result = await getEmployeeTodayTasksLoadResult({ apiUrl, ...(cookieHeader !== undefined ? { cookieHeader } : {}), fetchImpl });
  return result.status === 'ready' ? result.data : null;
}

export async function getEmployeeTodayTasksLoadResult({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<StaffTaskLoadResult<EmployeeTodayTasks>> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return { status: 'denied' };

  try {
    const response = await fetchImpl(new URL('/tasks/today', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (response.status === 401 || response.status === 403) return { status: 'denied' };
    if (!response.ok) return { status: 'error' };
    const data = tasksFrom((await response.json()) as EmployeeTodayBody);
    return data ? { status: 'ready', data } : { status: 'error' };
  } catch {
    return { status: 'error' };
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
  const result = await getManagerControlRoomTasksLoadResult({ apiUrl, ...(cookieHeader !== undefined ? { cookieHeader } : {}), fetchImpl });
  return result.status === 'ready' ? result.data : null;
}

export async function getManagerControlRoomTasksLoadResult({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<StaffTaskLoadResult<ManagerControlRoomTasks>> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return { status: 'denied' };

  try {
    const response = await fetchImpl(new URL('/tasks/manager-rollup', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (response.status === 401 || response.status === 403) return { status: 'denied' };
    if (!response.ok) return { status: 'error' };
    const data = managerRollupFrom((await response.json()) as ManagerControlRoomBody);
    return data ? { status: 'ready', data } : { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

export type QuickAddTaskPayload = {
  title: string;
  what: string;
  whoId: string;
  when: string;
  dueAt?: string;
  isCustomerPromise?: boolean;
  links?: { entityType: string; entityId: string }[];
};

export type UpdateTaskPayload = {
  status?: StaffTaskStatus;
  statusNote?: string;
  assigneeId?: string;
  dueAt?: string;
  nextAction?: { what: string; whoId: string; when: string } | null;
  isCustomerPromise?: boolean;
};

export async function quickAddTask(payload: QuickAddTaskPayload, fetchImpl: typeof fetch = fetch): Promise<StaffWriteResult> {
  return taskWrite('/tasks/quick-add', payload, 'POST', fetchImpl);
}

export async function updateTask(taskId: string, payload: UpdateTaskPayload, fetchImpl: typeof fetch = fetch): Promise<StaffWriteResult> {
  return taskWrite(`/tasks/${encodeURIComponent(taskId)}`, payload, 'PATCH', fetchImpl);
}

function tasksFrom(body: EmployeeTodayBody): EmployeeTodayTasks | null {
  const result = {} as EmployeeTodayTasks;
  for (const section of TASK_SECTIONS) {
    if (section === 'completed' && body[section] === undefined) {
      result.completed = [];
      continue;
    }
    if (!Array.isArray(body[section])) return null;
    const tasks = body[section].map(staffTaskFrom);
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
    const tasks = body[section].map(staffTaskFrom);
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
    const task = staffTaskFrom(row);
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

export function staffTaskFrom(task: Partial<StaffTask>): StaffTask | null {
  if (
    typeof task.id !== 'string' ||
    typeof task.title !== 'string' ||
    typeof task.ownerId !== 'string' ||
    typeof task.assigneeId !== 'string' ||
    typeof task.dueAt !== 'string' ||
    typeof task.displayTimeZone !== 'string' ||
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
    ownerName: typeof task.ownerName === 'string' ? task.ownerName : null,
    assigneeId: task.assigneeId,
    assigneeName: typeof task.assigneeName === 'string' ? task.assigneeName : null,
    branchId: typeof task.branchId === 'string' ? task.branchId : null,
    branchName: typeof task.branchName === 'string' ? task.branchName : null,
    displayTimeZone: task.displayTimeZone,
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
  return { what: value.what, whoId: value.whoId, whoName: typeof value.whoName === 'string' ? value.whoName : null, when: value.when };
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

async function taskWrite(path: string, payload: unknown, method: 'PATCH' | 'POST', fetchImpl: typeof fetch): Promise<StaffWriteResult> {
  const cookies = await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return 'denied';
  const csrf = readCookie(cookies, CSRF_COOKIE);
  try {
    const response = await fetchImpl(new URL(path, process.env.API_URL ?? 'http://localhost:3000'), {
      body: JSON.stringify(payload),
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'content-type': 'application/json',
        cookie: cookies,
        ...(csrf ? { 'x-csrf-token': csrf } : {}),
      },
      method,
    });
    if (response.status === 401 || response.status === 403) return 'denied';
    return response.ok ? 'success' : 'error';
  } catch {
    return 'error';
  }
}

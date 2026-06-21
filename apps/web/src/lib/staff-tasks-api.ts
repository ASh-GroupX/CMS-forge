type TaskSectionKey = 'dueToday' | 'overdue' | 'overduePromises' | 'assignedToMe' | 'waitingOnMe';

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

type EmployeeTodayBody = Partial<Record<TaskSectionKey, Partial<StaffTask>[]>>;

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

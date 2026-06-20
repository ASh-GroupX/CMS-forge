import { ComplaintStatus, ComplaintTransitionAction, SlaEventType, TaskStatus } from '@prisma/client';

const HOUR_MS = 60 * 60 * 1000;

export type TaskKpiRow = {
  id: string;
  dueAt: Date;
  status: TaskStatus;
  isCustomerPromise: boolean;
};

export type TaskKpiStatusEvent = {
  taskId: string;
  toStatus: TaskStatus;
  createdAt: Date;
};

export type TaskPromiseKpis = {
  onTimeCompletionPercent: number;
  activeOverdueCount: number;
  averageDelayHours: number;
  customerPromiseKeptPercent: number;
};

export type ComplaintCaseKpiRow = {
  id: string;
  createdAt: Date;
};

export type ComplaintCaseStatusEvent = {
  recordId: string;
  toStatus: ComplaintStatus;
  action: ComplaintTransitionAction | null;
  createdAt: Date;
};

export type ComplaintCaseSlaEvent = {
  recordId: string;
  type: SlaEventType;
  occurredAt: Date;
};

export type ComplaintCaseKpis = {
  reopenedCount: number;
  escalationCount: number;
  averageFirstResponseHours: number;
  averageResolutionHours: number;
};

export function taskPromiseKpis(tasks: TaskKpiRow[], events: TaskKpiStatusEvent[], now: Date): TaskPromiseKpis {
  const doneAtByTask = earliestDoneByTask(events);
  const completed = tasks.filter((task) => doneAtByTask.has(task.id));
  const promiseCompleted = completed.filter((task) => task.isCustomerPromise);

  return {
    onTimeCompletionPercent: percent(completed.filter((task) => doneAtByTask.get(task.id)! <= task.dueAt).length, completed.length),
    activeOverdueCount: tasks.filter((task) => task.status !== TaskStatus.DONE && task.dueAt < now).length,
    averageDelayHours: average(completed.map((task) => Math.max(0, doneAtByTask.get(task.id)!.getTime() - task.dueAt.getTime()) / HOUR_MS)),
    customerPromiseKeptPercent: percent(promiseCompleted.filter((task) => doneAtByTask.get(task.id)! <= task.dueAt).length, promiseCompleted.length),
  };
}

export function complaintCaseKpis(records: ComplaintCaseKpiRow[], statusEvents: ComplaintCaseStatusEvent[], slaEvents: ComplaintCaseSlaEvent[]): ComplaintCaseKpis {
  return {
    reopenedCount: statusEvents.filter(isReopened).length,
    escalationCount: slaEvents.filter((event) => event.type === SlaEventType.BREACH).length,
    averageFirstResponseHours: averageFirstEventHours(records, statusEvents, isFirstResponse),
    averageResolutionHours: averageFirstEventHours(records, statusEvents, isResolution),
  };
}

function earliestDoneByTask(events: TaskKpiStatusEvent[]): Map<string, Date> {
  const doneAtByTask = new Map<string, Date>();
  for (const event of events) {
    if (event.toStatus !== TaskStatus.DONE) continue;
    const current = doneAtByTask.get(event.taskId);
    if (!current || event.createdAt < current) doneAtByTask.set(event.taskId, event.createdAt);
  }
  return doneAtByTask;
}

function percent(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : round((numerator / denominator) * 100);
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function averageFirstEventHours(records: ComplaintCaseKpiRow[], events: ComplaintCaseStatusEvent[], match: (event: ComplaintCaseStatusEvent) => boolean): number {
  const createdAtById = new Map(records.map((record) => [record.id, record.createdAt]));
  const firstEventById = new Map<string, Date>();
  for (const event of events) {
    if (!match(event) || !createdAtById.has(event.recordId)) continue;
    const current = firstEventById.get(event.recordId);
    if (!current || event.createdAt < current) firstEventById.set(event.recordId, event.createdAt);
  }
  return average([...firstEventById].map(([id, occurredAt]) => Math.max(0, occurredAt.getTime() - createdAtById.get(id)!.getTime()) / HOUR_MS));
}

function isReopened(event: ComplaintCaseStatusEvent): boolean {
  return event.action === ComplaintTransitionAction.REOPEN || event.toStatus === ComplaintStatus.REOPENED;
}

function isFirstResponse(event: ComplaintCaseStatusEvent): boolean {
  return event.action !== ComplaintTransitionAction.SUBMIT;
}

function isResolution(event: ComplaintCaseStatusEvent): boolean {
  return event.toStatus === ComplaintStatus.RESOLVED;
}

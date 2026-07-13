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
  closedAt?: Date | null;
  status?: ComplaintStatus;
  hasSlaObligation?: boolean;
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
  reopenRate: number;
  escalationCount: number;
  slaBreachRate: number;
  medianTatHours: number;
  agingBuckets: { zeroToOneDays: number; twoToThreeDays: number; fourToSevenDays: number; overSevenDays: number };
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

export function complaintCaseKpis(records: ComplaintCaseKpiRow[], statusEvents: ComplaintCaseStatusEvent[], slaEvents: ComplaintCaseSlaEvent[], now = new Date()): ComplaintCaseKpis {
  const reopenedCount = statusEvents.filter(isReopened).length;
  const closedRecords = records.filter((record) => closureAt(record, statusEvents));
  const closedRecordIds = new Set(closedRecords.map((record) => record.id));
  const reopenedRecordIds = new Set(statusEvents.filter(isReopened).map((event) => event.recordId));
  const slaRecords = records.filter((record) => record.hasSlaObligation !== false);
  return {
    reopenedCount,
    reopenRate: percent([...reopenedRecordIds].filter((id) => closedRecordIds.has(id)).length, closedRecords.length),
    escalationCount: slaEvents.filter((event) => event.type === SlaEventType.BREACH).length,
    slaBreachRate: percent(new Set(slaEvents.filter((event) => event.type === SlaEventType.BREACH).map((event) => event.recordId)).size, slaRecords.length),
    medianTatHours: median(closedRecords.map((record) => Math.max(0, closureAt(record, statusEvents)!.getTime() - record.createdAt.getTime()) / HOUR_MS)),
    agingBuckets: agingBuckets(records, now),
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

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return round(sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2);
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
  return event.action !== ComplaintTransitionAction.SUBMIT && event.action !== ComplaintTransitionAction.REOPEN;
}

function isResolution(event: ComplaintCaseStatusEvent): boolean {
  return event.toStatus === ComplaintStatus.RESOLVED;
}

function closureAt(record: ComplaintCaseKpiRow, events: ComplaintCaseStatusEvent[]): Date | null {
  if (record.closedAt) return record.closedAt;
  return events.filter((event) => event.recordId === record.id && event.toStatus === ComplaintStatus.CLOSED).sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())[0]?.createdAt ?? null;
}

function agingBuckets(records: ComplaintCaseKpiRow[], now: Date): ComplaintCaseKpis['agingBuckets'] {
  const buckets = { zeroToOneDays: 0, twoToThreeDays: 0, fourToSevenDays: 0, overSevenDays: 0 };
  for (const record of records) {
    if (record.hasSlaObligation === false) continue;
    if (record.status === ComplaintStatus.CLOSED || record.status === ComplaintStatus.REJECTED) continue;
    const days = Math.floor(Math.max(0, now.getTime() - record.createdAt.getTime()) / (24 * HOUR_MS));
    if (days <= 1) buckets.zeroToOneDays += 1;
    else if (days <= 3) buckets.twoToThreeDays += 1;
    else if (days <= 7) buckets.fourToSevenDays += 1;
    else buckets.overSevenDays += 1;
  }
  return buckets;
}

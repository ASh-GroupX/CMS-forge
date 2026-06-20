import { TaskStatus } from '@prisma/client';

export type TaskEscalationRow = {
  id: string;
  status: TaskStatus;
  dueAt: Date;
  nextActionWhen?: Date | null;
};

export type TaskEscalationPolicy = {
  dueSoonMinutes: number;
  teamLeaderAfterMinutes: number;
  branchManagerAfterMinutes: number;
  highPriorityAfterMinutes: number;
};

export type TaskEscalationCandidate = {
  taskId: string;
  level: 'DUE_SOON' | 'TEAM_LEADER' | 'BRANCH_MANAGER' | 'HIGH_PRIORITY';
  reason: 'DUE_SOON' | 'OVERDUE';
  triggerAt: string;
  overdueMinutes: number;
};

export const defaultTaskEscalationPolicy: TaskEscalationPolicy = {
  dueSoonMinutes: 24 * 60,
  teamLeaderAfterMinutes: 0,
  branchManagerAfterMinutes: 24 * 60,
  highPriorityAfterMinutes: 72 * 60,
};

export function selectTaskEscalations(
  tasks: TaskEscalationRow[],
  policy: TaskEscalationPolicy = defaultTaskEscalationPolicy,
  now: Date = new Date(),
): TaskEscalationCandidate[] {
  const nowMs = now.getTime();
  const dueSoonMs = policy.dueSoonMinutes * 60_000;
  return tasks
    .filter((task) => task.status !== TaskStatus.DONE)
    .flatMap((task) => {
      const triggerAt = earliest(task.dueAt, task.nextActionWhen);
      const deltaMs = nowMs - triggerAt.getTime();
      if (deltaMs < 0 && Math.abs(deltaMs) <= dueSoonMs) return [candidate(task.id, 'DUE_SOON', 'DUE_SOON', triggerAt, 0)];
      if (deltaMs < 0) return [];
      const overdueMinutes = Math.floor(deltaMs / 60_000);
      return [candidate(task.id, overdueLevel(overdueMinutes, policy), 'OVERDUE', triggerAt, overdueMinutes)];
    })
    .sort((a, b) => a.triggerAt.localeCompare(b.triggerAt) || a.taskId.localeCompare(b.taskId));
}

function earliest(dueAt: Date, nextActionWhen?: Date | null): Date {
  return nextActionWhen && nextActionWhen < dueAt ? nextActionWhen : dueAt;
}

function overdueLevel(overdueMinutes: number, policy: TaskEscalationPolicy): TaskEscalationCandidate['level'] {
  if (overdueMinutes >= policy.highPriorityAfterMinutes) return 'HIGH_PRIORITY';
  if (overdueMinutes >= policy.branchManagerAfterMinutes) return 'BRANCH_MANAGER';
  return overdueMinutes >= policy.teamLeaderAfterMinutes ? 'TEAM_LEADER' : 'DUE_SOON';
}

function candidate(
  taskId: string,
  level: TaskEscalationCandidate['level'],
  reason: TaskEscalationCandidate['reason'],
  triggerAt: Date,
  overdueMinutes: number,
): TaskEscalationCandidate {
  return { taskId, level, reason, triggerAt: triggerAt.toISOString(), overdueMinutes };
}

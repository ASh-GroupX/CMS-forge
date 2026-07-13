import { ComplaintStatus } from '@prisma/client';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { SlaRepository } from './sla.repository.js';
import type { SlaDeadlineBreachRecord, SlaDeadlineWarningRecord } from './sla.repository.js';

type SlaDeadlineJobRecord = SlaDeadlineWarningRecord | SlaDeadlineBreachRecord;
type SlaEscalationStep = 'LEVEL2' | 'LEVEL3';
type DueSlaEscalation = { step: SlaEscalationStep; route: string; idempotencyKey: string };
type SlaEscalationRepository = Pick<SlaRepository, 'findBreachEventsForEscalation'>;

export type RunSlaEscalationJobResult = { scanned: number; queued: number; skipped: number; escalationIdempotencyKeys: string[] };

export function isTerminalComplaint(deadline: SlaDeadlineJobRecord): boolean {
  return deadline.complaint.status === ComplaintStatus.CLOSED || deadline.complaint.status === ComplaintStatus.REJECTED;
}

export function isPausedAfterDeadline(deadline: SlaDeadlineJobRecord): boolean {
  return deadline.complaint.slaEvents.some((event) => event.stage === deadline.stage && event.occurredAt.getTime() > deadline.occurredAt.getTime());
}

export function isWarningDue(deadline: SlaDeadlineWarningRecord, now: Date): boolean {
  if (!deadline.dueAt || !deadline.policy) return false;
  if (!Number.isInteger(deadline.policy.durationMinutes) || deadline.policy.durationMinutes <= 0) return false;
  if (!Number.isInteger(deadline.policy.warningPercent) || deadline.policy.warningPercent <= 0 || deadline.policy.warningPercent > 100) return false;
  const remainingPercent = 100 - deadline.policy.warningPercent;
  const warningAt = deadline.dueAt.getTime() - Math.round(deadline.policy.durationMinutes * 60_000 * remainingPercent / 100);
  return warningAt <= now.getTime();
}

export function dueSlaEscalations(deadline: SlaDeadlineBreachRecord, now: Date): DueSlaEscalation[] {
  return [
    dueSlaEscalation(deadline, now, 'LEVEL2', deadline.policy?.escalationLevel2, deadline.policy?.escalationLevel2AfterBreachMinutes),
    dueSlaEscalation(deadline, now, 'LEVEL3', deadline.policy?.escalationLevel3, deadline.policy?.escalationLevel3AfterBreachMinutes),
  ].filter((item): item is DueSlaEscalation => item !== null);
}

export async function runSlaEscalationJob(repository: SlaEscalationRepository, notificationsService: Pick<NotificationsService, 'queueInternal'> | undefined, now: Date): Promise<RunSlaEscalationJobResult> {
  const breaches = await repository.findBreachEventsForEscalation();
  const result: RunSlaEscalationJobResult = { scanned: breaches.length, queued: 0, skipped: 0, escalationIdempotencyKeys: [] };

  for (const breach of breaches) {
    if (!breach.dueAt || isTerminalComplaint(breach) || isPausedAfterDeadline(breach)) {
      result.skipped += 1;
      continue;
    }
    const escalations = dueSlaEscalations(breach, now);
    if (escalations.length === 0) {
      result.skipped += 1;
      continue;
    }
    let queuedForBreach = 0;
    for (const escalation of escalations) {
      if (await queueSlaEscalationNotification(notificationsService, breach, escalation)) {
        queuedForBreach += 1;
        result.queued += 1;
        result.escalationIdempotencyKeys.push(escalation.idempotencyKey);
      }
    }
    if (queuedForBreach === 0) result.skipped += 1;
  }

  return result;
}

export async function queueSlaWarningNotification(notificationsService: Pick<NotificationsService, 'queueInternal'> | undefined, deadline: SlaDeadlineWarningRecord, idempotencyKey: string): Promise<void> {
  const ownerId = deadline.complaint.ownerId;
  if (!notificationsService || !ownerId || !deadline.dueAt) return;
  await notificationsService.queueInternal({
    complaintId: deadline.complaintId,
    recipientUserId: ownerId,
    templateCode: 'sla.warning.internal',
    locale: 'en',
    idempotencyKey,
    payload: { complaintId: deadline.complaintId, policyId: deadline.policyId, stage: deadline.stage, dueAt: deadline.dueAt.toISOString(), warningIdempotencyKey: idempotencyKey },
  });
}

export async function queueSlaBreachNotification(notificationsService: Pick<NotificationsService, 'queueInternal'> | undefined, deadline: SlaDeadlineBreachRecord, idempotencyKey: string): Promise<void> {
  const escalationLevel = typeof deadline.policy?.escalationLevel1 === 'string' ? deadline.policy.escalationLevel1.trim() : '';
  if (!notificationsService || !escalationLevel || !deadline.dueAt) return;
  await notificationsService.queueInternal({
    complaintId: deadline.complaintId,
    templateCode: 'sla.breach.internal',
    locale: 'en',
    idempotencyKey,
    payload: { complaintId: deadline.complaintId, policyId: deadline.policyId, stage: deadline.stage, dueAt: deadline.dueAt.toISOString(), breachIdempotencyKey: idempotencyKey, escalationLevel },
  });
}

export async function queueSlaEscalationNotification(notificationsService: Pick<NotificationsService, 'queueInternal'> | undefined, deadline: SlaDeadlineBreachRecord, escalation: DueSlaEscalation): Promise<boolean> {
  if (!notificationsService || !deadline.dueAt) return false;
  await notificationsService.queueInternal({
    complaintId: deadline.complaintId,
    templateCode: 'sla.breach.internal',
    locale: 'en',
    idempotencyKey: escalation.idempotencyKey,
    payload: {
      complaintId: deadline.complaintId,
      policyId: deadline.policyId,
      stage: deadline.stage,
      dueAt: deadline.dueAt.toISOString(),
      breachIdempotencyKey: deadline.idempotencyKey,
      escalationLevel: escalation.route,
      escalationStep: escalation.step,
      escalationIdempotencyKey: escalation.idempotencyKey,
    },
  });
  return true;
}

function dueSlaEscalation(deadline: SlaDeadlineBreachRecord, now: Date, step: SlaEscalationStep, route: string | null | undefined, delayMinutes: number | null | undefined): DueSlaEscalation | null {
  const trimmedRoute = typeof route === 'string' ? route.trim() : '';
  const delay = typeof delayMinutes === 'number' && Number.isInteger(delayMinutes) && delayMinutes > 0 ? delayMinutes : null;
  if (!trimmedRoute || delay === null) return null;
  if (deadline.occurredAt.getTime() + delay * 60_000 > now.getTime()) return null;
  return { step, route: trimmedRoute, idempotencyKey: `sla:escalation:${deadlineKey(deadline.idempotencyKey)}:${step}` };
}

function deadlineKey(breachIdempotencyKey: string): string {
  return breachIdempotencyKey.startsWith('sla:breach:') ? breachIdempotencyKey.slice('sla:breach:'.length) : breachIdempotencyKey;
}

import 'reflect-metadata';
import { Logger, Module, type INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Queue, Worker } from 'bullmq';
import { fileURLToPath } from 'node:url';
import { RoleCode } from '@prisma/client';
import { AttachmentsModule } from '../modules/attachments/attachments.module.js';
import { AttachmentsService, type TransitionAttachmentScanInput } from '../modules/attachments/attachments.service.js';
import { NotificationsModule } from '../modules/notifications/notifications.module.js';
import { NotificationsService } from '../modules/notifications/notifications.service.js';
import { SlaService } from '../modules/sla/sla.service.js';
import { SlaModule } from '../modules/sla/sla.module.js';
import { TasksModule } from '../modules/tasks/tasks.module.js';
import { TasksService } from '../modules/tasks/tasks.service.js';
import { selectTaskEscalations } from '../modules/tasks/tasks.escalation.js';
import { redisConnectionFromUrl, workerQueueNames, type WorkerJobPayload, type WorkerQueueName } from './queue.js';

@Module({
  imports: [SlaModule, NotificationsModule, AttachmentsModule, TasksModule],
})
class WorkerModule {}

export const slaWarningJobName = 'sla.warning';
export const slaBreachJobName = 'sla.breach';
export const notificationEmailJobName = 'notifications.email';
export const notificationSmsJobName = 'notifications.sms';
export const notificationWhatsAppJobName = 'notifications.whatsapp';
export const taskEscalationJobName = 'tasks.escalation.scan';
export const attachmentScanJobName = 'attachments.scan';

type WorkerJob = { id?: string | number; name: string; data?: WorkerJobPayload };
type WorkerLogger = Pick<Logger, 'log'>;
type WorkerContext = Pick<INestApplicationContext, 'get'>;
type SlaRunner = Pick<SlaService, 'runWarningJob' | 'runBreachJob'>;
type NotificationsRunner = Pick<NotificationsService, 'dispatchQueuedEmail' | 'dispatchQueuedSms' | 'dispatchQueuedWhatsApp' | 'queueInternal'>;
type AttachmentsRunner = Pick<AttachmentsService, 'transitionScanStatus'>;
type TaskEscalationRunner = Pick<TasksService, 'managerControlRoom'>;
type QueueScheduler = Pick<Queue<WorkerJobPayload>, 'upsertJobScheduler' | 'close'>;

async function bootstrap(): Promise<void> {
  const logger = new Logger('Worker');
  const app = await NestFactory.createApplicationContext(WorkerModule);
  const connection = redisConnectionFromUrl();
  const slaQueue = new Queue<WorkerJobPayload>('sla', { connection });
  const notificationsQueue = new Queue<WorkerJobPayload>('notifications', { connection });
  const workers = workerQueueNames.map(
    (queueName) =>
      new Worker<WorkerJobPayload>(
        queueName,
        async (job) => {
          return processWorkerJob(queueName, job, app, logger);
        },
        { connection },
      ),
  );

  for (const worker of workers) {
    worker.on('ready', () => logger.log(`queue connected queue=${worker.name}`));
    worker.on('error', (error) => logger.error(`queue error queue=${worker.name}: ${error.message}`, error.stack));
  }

  await scheduleSlaJobs(slaQueue);
  await scheduleNotificationJobs(notificationsQueue);

  const shutdown = () => close(app, workers, [slaQueue, notificationsQueue], logger);
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());

  await Promise.all(workers.map((worker) => worker.waitUntilReady()));
  logger.log(`worker ready queues=${workerQueueNames.join(',')}`);
}

export async function processWorkerJob(
  queueName: WorkerQueueName,
  job: WorkerJob,
  app: WorkerContext,
  logger: WorkerLogger = new Logger('Worker'),
): Promise<unknown> {
  if (queueName === 'sla') {
    if (job.name !== slaWarningJobName && job.name !== slaBreachJobName) return logNoopJob(queueName, job, logger);
    const result = await runSlaJob(app.get(SlaService), job.name, new Date());
    logger.log(`sla job received name=${job.name} id=${job.id ?? 'unknown'} result=${JSON.stringify(result)}`);
    return result;
  }

  if (queueName === 'notifications') {
    if (job.name === taskEscalationJobName) {
      const result = await runTaskEscalationJob(app.get(TasksService), app.get(NotificationsService), new Date());
      logger.log(`task escalation job received name=${job.name} id=${job.id ?? 'unknown'} result=${JSON.stringify(result)}`);
      return result;
    }
    if (job.name !== notificationEmailJobName && job.name !== notificationSmsJobName && job.name !== notificationWhatsAppJobName) return logNoopJob(queueName, job, logger);
    const result = await runNotificationJob(app.get(NotificationsService), job.name, new Date());
    logger.log(`notification job received name=${job.name} id=${job.id ?? 'unknown'} result=${JSON.stringify(result)}`);
    return result;
  }

  if (queueName === 'attachments-scan') {
    if (job.name !== attachmentScanJobName) return logNoopJob(queueName, job, logger);
    const result = await runAttachmentScanJob(app.get(AttachmentsService), job.data);
    logger.log(`attachment scan job received name=${job.name} id=${job.id ?? 'unknown'} result=${JSON.stringify(result)}`);
    return result;
  }

  return logNoopJob(queueName, job, logger);
}

export async function scheduleSlaJobs(
  queue: QueueScheduler,
  everyMs = Number(process.env.SLA_JOB_INTERVAL_MS ?? 60_000),
): Promise<void> {
  if (!Number.isInteger(everyMs) || everyMs < 1_000) {
    throw new Error('SLA_JOB_INTERVAL_MS must be at least 1000');
  }

  await queue.upsertJobScheduler(slaWarningJobName, { every: everyMs }, { name: slaWarningJobName, data: {} });
  await queue.upsertJobScheduler(slaBreachJobName, { every: everyMs }, { name: slaBreachJobName, data: {} });
}

export async function scheduleNotificationJobs(
  queue: QueueScheduler,
  everyMs = Number(process.env.NOTIFICATION_JOB_INTERVAL_MS ?? 60_000),
): Promise<void> {
  if (!Number.isInteger(everyMs) || everyMs < 1_000) {
    throw new Error('NOTIFICATION_JOB_INTERVAL_MS must be at least 1000');
  }

  await queue.upsertJobScheduler(notificationEmailJobName, { every: everyMs }, { name: notificationEmailJobName, data: {} });
  await queue.upsertJobScheduler(notificationSmsJobName, { every: everyMs }, { name: notificationSmsJobName, data: {} });
  await queue.upsertJobScheduler(notificationWhatsAppJobName, { every: everyMs }, { name: notificationWhatsAppJobName, data: {} });
  await queue.upsertJobScheduler(taskEscalationJobName, { every: everyMs }, { name: taskEscalationJobName, data: {} });
}

async function runSlaJob(slaService: SlaRunner, jobName: string, now: Date): Promise<unknown> {
  if (jobName === slaWarningJobName) {
    return slaService.runWarningJob(now);
  }
  if (jobName === slaBreachJobName) {
    return slaService.runBreachJob(now);
  }
  return { ok: true };
}

async function runNotificationJob(notificationsService: NotificationsRunner, jobName: string, now: Date): Promise<unknown> {
  if (jobName === notificationEmailJobName) {
    return notificationsService.dispatchQueuedEmail(25, now);
  }
  if (jobName === notificationSmsJobName) {
    return notificationsService.dispatchQueuedSms(25, now);
  }
  if (jobName === notificationWhatsAppJobName) {
    return notificationsService.dispatchQueuedWhatsApp(25, now);
  }
  return { ok: true };
}

async function runTaskEscalationJob(tasksService: TaskEscalationRunner, notificationsService: NotificationsRunner, now: Date): Promise<unknown> {
  const rollup = await tasksService.managerControlRoom({ roleCode: RoleCode.ADMIN, branchId: null }, now);
  const tasks = new Map(rollup.escalated.map((task) => [task.id, task]));
  const candidates = selectTaskEscalations(rollup.escalated.map((task) => ({
    id: task.id,
    status: task.status,
    dueAt: new Date(task.dueAt),
    nextActionWhen: task.nextAction ? new Date(task.nextAction.when) : null,
  })), undefined, now);

  for (const candidate of candidates) {
    const task = tasks.get(candidate.taskId);
    if (!task) continue;
    const idempotencyKey = `task-escalation:${candidate.taskId}:${candidate.level}:${candidate.triggerAt}`;
    await notificationsService.queueInternal({
      recipientUserId: task.nextAction?.whoId ?? task.assigneeId,
      templateCode: 'task.escalation.internal',
      locale: 'en',
      idempotencyKey,
      payload: { idempotencyKey, taskId: candidate.taskId, level: candidate.level, reason: candidate.reason, triggerAt: candidate.triggerAt, overdueMinutes: candidate.overdueMinutes },
    });
  }
  return { scanned: rollup.escalated.length, queued: candidates.length };
}

async function runAttachmentScanJob(attachmentsService: AttachmentsRunner, payload: WorkerJobPayload | undefined): Promise<unknown> {
  const attachment = await attachmentsService.transitionScanStatus(attachmentScanInput(payload));
  return { attachmentId: attachment.id, scanStatus: attachment.scanStatus };
}

async function close(
  app: INestApplicationContext,
  workers: Worker<WorkerJobPayload>[],
  queues: QueueScheduler[],
  logger: Logger,
): Promise<void> {
  await Promise.all(workers.map((worker) => worker.close()));
  await Promise.all(queues.map((queue) => queue.close()));
  await app.close();
  logger.log('worker stopped');
}

function attachmentScanInput(payload: WorkerJobPayload | undefined): TransitionAttachmentScanInput {
  if (!isRecord(payload)) {
    throw new Error('Attachment scan job payload is invalid');
  }

  const toStatus = payload.toStatus;
  if (toStatus !== 'CLEAN' && toStatus !== 'REJECTED') {
    throw new Error('Attachment scan job payload toStatus must be CLEAN or REJECTED');
  }

  return {
    attachmentId: requiredPayloadText(payload.attachmentId, 'attachmentId'),
    toStatus,
    actorId: optionalPayloadText(payload.actorId, 'actorId'),
    branchId: optionalPayloadText(payload.branchId, 'branchId'),
    correlationId: requiredPayloadText(payload.correlationId, 'correlationId'),
    ipAddress: optionalPayloadText(payload.ipAddress, 'ipAddress'),
    userAgent: optionalPayloadText(payload.userAgent, 'userAgent'),
  };
}

function requiredPayloadText(value: unknown, field: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw new Error(`Attachment scan job payload ${field} is required`);
}

function optionalPayloadText(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw new Error(`Attachment scan job payload ${field} must be text`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function logNoopJob(queueName: WorkerQueueName, job: WorkerJob, logger: WorkerLogger): { ok: true } {
  logger.log(`test job received queue=${queueName} name=${job.name} id=${job.id}`);
  return { ok: true };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void bootstrap().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    new Logger('Worker').error(`worker failed: ${message}`, stack);
    process.exitCode = 1;
  });
}

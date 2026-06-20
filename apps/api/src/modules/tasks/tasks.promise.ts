import { HttpStatus } from '@nestjs/common';
import { TaskLinkEntityType, TaskStatus } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';

export type PromiseTask = {
  isCustomerPromise: boolean;
  dueAt: Date;
};

export type PromiseStatusEvent = {
  toStatus: TaskStatus;
  createdAt: Date;
};

const promiseLinkTypes = new Set<string>([
  TaskLinkEntityType.CUSTOMER,
  TaskLinkEntityType.COMPLAINT,
  TaskLinkEntityType.CASE,
  TaskLinkEntityType.DEAL,
]);

export function assertPromiseLink(isCustomerPromise: boolean, links: { entityType: TaskLinkEntityType }[]): void {
  if (isCustomerPromise && !links.some((link) => promiseLinkTypes.has(link.entityType))) {
    throw new AppException('TASK_PROMISE_LINK_REQUIRED', 'Promise tasks require a customer, complaint, case, or deal link', HttpStatus.CONFLICT);
  }
}

export function promiseKeptOnTime(task: PromiseTask, events: PromiseStatusEvent[]): boolean | null {
  if (!task.isCustomerPromise) return null;
  const doneAt = events
    .filter((event) => event.toStatus === TaskStatus.DONE)
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())[0]?.createdAt;
  return doneAt ? doneAt <= task.dueAt : false;
}

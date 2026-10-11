import { Logger } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import type { NotificationsService } from '../notifications/notifications.service.js';

export class TaskRecipientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  recipientUsers(taskId: string) {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        lockedAt: null,
        role: { code: { not: 'CUSTOMER_PORTAL' } },
        OR: [
          { assignedTasks: { some: { id: taskId } } },
          { taskParticipants: { some: { taskId, role: { in: ['ASSIGNEE', 'PARTICIPANT'] } } } },
          { department: { taskRecipients: { some: { taskId } } } },
        ],
      },
      select: { id: true, email: true, nameEn: true, nameAr: true },
    });
  }
}

const logger = new Logger('TaskRecipients');

export async function notifyTaskRecipients(
  repository: TaskRecipientsRepository | undefined,
  notifications: NotificationsService | undefined,
  taskId: string,
  title: string,
): Promise<void> {
  if (!repository || !notifications) return;
  const recipients = await repository.recipientUsers(taskId);
  const deliveries = await Promise.allSettled(recipients.flatMap((recipient) => {
    const key = `task-assignment:${taskId}:${recipient.id}`;
    const recipientName = recipient.nameAr || recipient.nameEn;
    const payload = {
      taskId,
      title,
      href: `/tasks/${taskId}`,
      recipientName,
      subject: `Task assignment: ${title}`,
      textBody: `${recipientName}, a task was assigned to you: ${title}`,
      htmlBody: `<p>${recipientName}, a task was assigned to you: ${title}</p>`,
      entityType: 'TASK',
      entityId: taskId,
    };
    return [
      notifications.queueInternal({
        recipientUserId: recipient.id, templateCode: 'assignment.updated', locale: 'ar',
        idempotencyKey: `${key}:in-app`, payload,
      }),
      notifications.queueInternal({
        recipientUserId: recipient.id, channel: NotificationChannel.EMAIL,
        templateCode: 'assignment.updated', locale: 'ar',
        idempotencyKey: `${key}:email`, payload: { ...payload, to: recipient.email },
      }),
    ];
  }));
  const failed = deliveries.filter((delivery) => delivery.status === 'rejected').length;
  if (failed > 0) logger.error(`Post-commit task assignment notification failures: ${failed}`);
}

import type { AuditRecordInput } from '../../core/audit.service.js';

export type NotificationReadAuditContext = {
  actorId?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export function notificationReadAudit(action: string, targetId: string | null, audit: NotificationReadAuditContext, readCount?: number): AuditRecordInput {
  return {
    eventType: 'NOTIFICATION',
    action,
    actorId: audit.actorId ?? null,
    targetType: 'NOTIFICATION',
    targetId,
    correlationId: audit.correlationId ?? null,
    ipAddress: audit.ipAddress ?? null,
    userAgent: audit.userAgent ?? null,
    ...(readCount === undefined ? {} : { metadata: { readCount } }),
  };
}

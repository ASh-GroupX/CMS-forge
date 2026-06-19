import type { AuditRecordInput } from '../../core/audit.service.js';
import type { NotificationTemplateRecord } from './notifications.repository.js';

export type NotificationTemplateAuditContext = {
  actorId?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export function templateAudit(
  action: string,
  template: NotificationTemplateRecord,
  context: NotificationTemplateAuditContext,
  metadata: Record<string, unknown>,
): AuditRecordInput {
  return {
    eventType: 'CONFIG',
    action,
    actorId: context.actorId ?? null,
    branchId: null,
    targetType: 'notification_template',
    targetId: template.id,
    correlationId: context.correlationId ?? null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
    metadata: {
      code: template.code,
      channel: template.channel,
      locale: template.locale,
      version: template.version,
      changedFields: Object.keys(metadata),
    },
  };
}

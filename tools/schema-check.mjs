import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const requiredModels = [
  'Branch',
  'Department',
  'Role',
  'User',
  'Category',
  'Customer',
  'Vehicle',
  'Complaint',
  'ComplaintStatusHistory',
  'Approval',
  'Attachment',
  'Comment',
  'SlaPolicy',
  'SlaEvent',
  'Notification',
  'NotificationDeliveryAttempt',
  'NotificationTemplate',
  'CustomerNotificationPreference',
  'Survey',
  'Compensation',
  'PortalVerification',
  'PortalSession',
  'Case',
  'CaseLink',
  'AuditLog',
];

export function checkSchemaText(text) {
  const errors = [];

  for (const model of requiredModels) {
    if (!new RegExp(`model\\s+${model}\\s+{`).test(text)) {
      errors.push(`missing model: ${model}`);
    }
  }

  for (const [model, table] of [
    ['ComplaintStatusHistory', 'complaint_status_history'],
    ['NotificationDeliveryAttempt', 'notification_delivery_attempts'],
    ['NotificationTemplate', 'notification_templates'],
    ['CustomerNotificationPreference', 'customer_notification_preferences'],
    ['Case', 'cases'],
    ['CaseLink', 'case_links'],
    ['AuditLog', 'audit_logs'],
  ]) {
    const block = text.match(new RegExp(`model\\s+${model}\\s+{[\\s\\S]*?\\n}`))?.[0] ?? '';
    if (!block.includes(`@@map("${table}")`)) {
      errors.push(`${model} must map to ${table}`);
    }
  }

  if (!/model\s+Complaint\s+{[\s\S]*statusHistory\s+ComplaintStatusHistory\[\]/.test(text)) {
    errors.push('Complaint must expose status history');
  }

  const historyBlock = text.match(/model\s+ComplaintStatusHistory\s+{[\s\S]*?\n}/)?.[0] ?? '';
  for (const [field, mappedColumn] of [
    ['action', null],
    ['actorRole', 'actor_role'],
    ['requestSource', 'request_source'],
  ]) {
    if (!new RegExp(`\\b${field}\\b`).test(historyBlock)) {
      errors.push(`ComplaintStatusHistory must include ${field}`);
    }

    if (mappedColumn && !historyBlock.includes(`@map("${mappedColumn}")`)) {
      errors.push(`ComplaintStatusHistory.${field} must map to ${mappedColumn}`);
    }
  }

  if (!/enum\s+ComplaintTransitionAction\s+{[\s\S]*SUBMIT[\s\S]*ROUTE_AGAIN/.test(text)) {
    errors.push('ComplaintTransitionAction must include workflow matrix actions');
  }

  if (!/enum\s+ComplaintTransitionRequestSource\s+{[\s\S]*STAFF_API[\s\S]*CUSTOMER_PORTAL/.test(text)) {
    errors.push('ComplaintTransitionRequestSource must include staff and portal sources');
  }

  if (!/enum\s+AuditEventType\s+{[\s\S]*SECURITY/.test(text)) {
    errors.push('AuditEventType must include SECURITY');
  }

  const caseBlock = text.match(/model\s+Case\s+{[\s\S]*?\n}/)?.[0] ?? '';
  for (const field of ['type', 'status', 'branchId', 'ownerId', 'subject', 'descriptionEn', 'links']) {
    if (!new RegExp(`\\b${field}\\b`).test(caseBlock)) errors.push(`Case must include ${field}`);
  }
  const caseLinkBlock = text.match(/model\s+CaseLink\s+{[\s\S]*?\n}/)?.[0] ?? '';
  for (const field of ['caseId', 'entityType', 'entityId']) {
    if (!new RegExp(`\\b${field}\\b`).test(caseLinkBlock)) errors.push(`CaseLink must include ${field}`);
  }
  if (!caseLinkBlock.includes('@@unique([caseId, entityType, entityId])')) {
    errors.push('CaseLink must enforce unique linked entities per case');
  }

  const templateBlock = text.match(/model\s+NotificationTemplate\s+{[\s\S]*?\n}/)?.[0] ?? '';
  for (const field of ['code', 'channel', 'locale', 'subject', 'body', 'version', 'isActive']) {
    if (!new RegExp(`\\b${field}\\b`).test(templateBlock)) {
      errors.push(`NotificationTemplate must include ${field}`);
    }
  }
  if (!templateBlock.includes('@@unique([code, channel, locale, version])')) {
    errors.push('NotificationTemplate must enforce version uniqueness');
  }
  if (!templateBlock.includes('@@index([code, channel, locale, isActive])')) {
    errors.push('NotificationTemplate must index active template lookup');
  }
  const attemptBlock = text.match(/model\s+NotificationDeliveryAttempt\s+{[\s\S]*?\n}/)?.[0] ?? '';
  for (const field of ['notificationId', 'channel', 'status', 'providerResult', 'failureReason', 'attemptedAt']) {
    if (!new RegExp(`\\b${field}\\b`).test(attemptBlock)) errors.push(`NotificationDeliveryAttempt must include ${field}`);
  }
  const preferenceBlock = text.match(/model\s+CustomerNotificationPreference\s+{[\s\S]*?\n}/)?.[0] ?? '';
  for (const field of ['customerId', 'preferredChannel', 'smsQuietStart', 'smsQuietEnd', 'timezone']) {
    if (!new RegExp(`\\b${field}\\b`).test(preferenceBlock)) errors.push(`CustomerNotificationPreference must include ${field}`);
  }

  return errors;
}

export function checkSchema(root = process.cwd()) {
  const text = readFileSync(join(root, 'packages/database/prisma/schema.prisma'), 'utf8');
  const errors = checkSchemaText(text);

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return { errors };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkSchema();
  console.log('Schema check passed');
}

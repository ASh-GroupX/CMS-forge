import assert from 'node:assert/strict';
import test from 'node:test';
import { checkSchema, checkSchemaText, requiredModels } from './schema-check.mjs';

test('current prisma schema includes the required core data model', () => {
  assert.deepEqual(checkSchema().errors, []);
});

test('schema check accepts the current core model draft', () => {
  const text = requiredModels
    .filter((model) => !['Complaint', 'ComplaintStatusHistory', 'NotificationDeliveryAttempt', 'NotificationTemplate', 'CustomerNotificationPreference', 'AuditLog'].includes(model))
    .map((model) => `model ${model} {\n  id String @id\n}`)
    .join('\n\n');
  const complaint = 'model Complaint {\n  id String @id\n  statusHistory ComplaintStatusHistory[]\n}';
  const history = `model ComplaintStatusHistory {
  id String @id
  action ComplaintTransitionAction?
  actorRole RoleCode? @map("actor_role")
  requestSource ComplaintTransitionRequestSource? @map("request_source")

  @@map("complaint_status_history")
}`;
  const template = `model NotificationTemplate {
  id String @id
  code String
  channel NotificationChannel
  locale String
  subject String?
  body String
  version Int
  isActive Boolean

  @@unique([code, channel, locale, version])
  @@index([code, channel, locale, isActive])
  @@map("notification_templates")
}`;
  const attempt = `model NotificationDeliveryAttempt {
  id String @id
  notificationId String
  channel NotificationChannel
  status NotificationStatus
  providerResult String?
  failureReason String?
  attemptedAt DateTime

  @@map("notification_delivery_attempts")
}`;
  const preference = `model CustomerNotificationPreference {
  id String @id
  customerId String
  preferredChannel NotificationChannel?
  smsQuietStart String?
  smsQuietEnd String?
  timezone String?

  @@map("customer_notification_preferences")
}`;
  const audit = 'model AuditLog {\n  id String @id\n\n  @@map("audit_logs")\n}';
  const actionEnum = 'enum ComplaintTransitionAction {\n  SUBMIT\n  ROUTE_AGAIN\n}';
  const requestSourceEnum = 'enum ComplaintTransitionRequestSource {\n  STAFF_API\n  CUSTOMER_PORTAL\n}';
  const auditEnum = 'enum AuditEventType {\n  SECURITY\n}';

  assert.deepEqual(checkSchemaText(`${text}\n${complaint}\n${history}\n${template}\n${attempt}\n${preference}\n${audit}\n${actionEnum}\n${requestSourceEnum}\n${auditEnum}`), []);
});

test('schema check rejects missing complaint history and audit storage', () => {
  assert.deepEqual(checkSchemaText('model Complaint {\n  id String @id\n}\n'), [
    ...requiredModels.filter((model) => model !== 'Complaint').map((model) => `missing model: ${model}`),
    'ComplaintStatusHistory must map to complaint_status_history',
    'NotificationDeliveryAttempt must map to notification_delivery_attempts',
    'NotificationTemplate must map to notification_templates',
    'CustomerNotificationPreference must map to customer_notification_preferences',
    'AuditLog must map to audit_logs',
    'Complaint must expose status history',
    'ComplaintStatusHistory must include action',
    'ComplaintStatusHistory must include actorRole',
    'ComplaintStatusHistory.actorRole must map to actor_role',
    'ComplaintStatusHistory must include requestSource',
    'ComplaintStatusHistory.requestSource must map to request_source',
    'ComplaintTransitionAction must include workflow matrix actions',
    'ComplaintTransitionRequestSource must include staff and portal sources',
    'AuditEventType must include SECURITY',
    'NotificationTemplate must include code',
    'NotificationTemplate must include channel',
    'NotificationTemplate must include locale',
    'NotificationTemplate must include subject',
    'NotificationTemplate must include body',
    'NotificationTemplate must include version',
    'NotificationTemplate must include isActive',
    'NotificationTemplate must enforce version uniqueness',
    'NotificationTemplate must index active template lookup',
    'NotificationDeliveryAttempt must include notificationId',
    'NotificationDeliveryAttempt must include channel',
    'NotificationDeliveryAttempt must include status',
    'NotificationDeliveryAttempt must include providerResult',
    'NotificationDeliveryAttempt must include failureReason',
    'NotificationDeliveryAttempt must include attemptedAt',
    'CustomerNotificationPreference must include customerId',
    'CustomerNotificationPreference must include preferredChannel',
    'CustomerNotificationPreference must include smsQuietStart',
    'CustomerNotificationPreference must include smsQuietEnd',
    'CustomerNotificationPreference must include timezone',
  ]);
});

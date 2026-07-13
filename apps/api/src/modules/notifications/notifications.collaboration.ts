import { CollaborationRecordType, NotificationChannel, type Prisma } from '@prisma/client';
import type { NotificationDigestRepository } from './notification-digest.repository.js';
import type { NotificationsService } from './notifications.service.js';

export type CollaborationRecipient = { userId: string; email: string; nameEn: string; nameAr: string };
export type CollaborationNotificationInput = { recordType: CollaborationRecordType; recordId: string; complaintId?: string | null; href: string; title: string; excerpt?: string | null; confidential: boolean; eventKey: string; assignment?: CollaborationRecipient | null; mentions: CollaborationRecipient[]; watchers: CollaborationRecipient[] };
type QueueNotifications = Pick<NotificationsService, 'queueInternal'>;

export async function queueCollaboration(notifications: QueueNotifications, digest: NotificationDigestRepository, input: CollaborationNotificationInput): Promise<void> {
  const recipients = new Map<string, { recipient: CollaborationRecipient; priority: number; reason: 'assignment' | 'mention' | 'cc' }>();
  const add = (recipient: CollaborationRecipient | null | undefined, priority: number, reason: 'assignment' | 'mention' | 'cc') => { if (!recipient?.userId || !recipient.email) return; const current = recipients.get(recipient.userId); if (!current || priority > current.priority) recipients.set(recipient.userId, { recipient, priority, reason }); };
  add(input.assignment, 3, 'assignment'); input.mentions.forEach((recipient) => add(recipient, 2, 'mention')); input.watchers.forEach((recipient) => add(recipient, 1, 'cc'));
  const excerpt = input.confidential ? null : clippedExcerpt(input.excerpt);
  await Promise.all([...recipients.values()].map(async ({ recipient, priority, reason }) => {
    const payload = collaborationPayload(input, recipient, reason, excerpt);
    await notifications.queueInternal({ complaintId: input.complaintId ?? null, recipientUserId: recipient.userId, templateCode: `collaboration.${input.recordType.toLowerCase()}.${reason}`, locale: 'ar', idempotencyKey: `${input.eventKey}:${recipient.userId}:in-app`, payload });
    if (priority >= 2) return notifications.queueInternal({ complaintId: input.complaintId ?? null, recipientUserId: recipient.userId, channel: NotificationChannel.EMAIL, templateCode: `collaboration.${input.recordType.toLowerCase()}.${reason}`, locale: 'ar', idempotencyKey: `${input.eventKey}:${recipient.userId}:email`, payload: emailPayload(payload, recipient.email) });
    return digest.queue({ recipientUserId: recipient.userId, recordType: input.recordType, recordId: input.recordId, eventKey: `${input.eventKey}:${recipient.userId}`, payload });
  }));
}

export async function flushCollaborationDigests(notifications: QueueNotifications, digest: NotificationDigestRepository, limit = 100, now = new Date()): Promise<{ queued: number; delivered: number }> {
  const items = await digest.pendingBefore(new Date(now.getTime() - 10 * 60 * 1000), limit);
  const grouped = new Map<string, typeof items>();
  for (const item of items) { const key = `${item.recipientUserId}:${item.recordType}:${item.recordId}`; grouped.set(key, [...(grouped.get(key) ?? []), item]); }
  let queued = 0; let delivered = 0;
  for (const group of grouped.values()) {
    const first = group[0]!;
    await notifications.queueInternal({ recipientUserId: first.recipientUserId, channel: NotificationChannel.EMAIL, templateCode: `collaboration.${first.recordType.toLowerCase()}.digest`, locale: 'ar', idempotencyKey: `digest:${first.recipientUserId}:${first.recordType}:${first.recordId}:${group.map((item) => item.id).join(':')}`, payload: digestPayload(first.payload, group.length, first.recipientUser.email) });
    queued += 1; delivered += await digest.markDelivered(group.map((item) => item.id), now);
  }
  return { queued, delivered };
}

function clippedExcerpt(value: string | null | undefined): string | null { const text = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''; return text ? text.slice(0, 240) : null; }
function collaborationPayload(input: CollaborationNotificationInput, recipient: CollaborationRecipient, reason: 'assignment' | 'mention' | 'cc', excerpt: string | null): Prisma.InputJsonValue { const secure = 'لديك تحديث جديد. افتح النظام لعرض التفاصيل.\nYou have a new update. Open the system to view details.'; const body = excerpt ? `لديك تحديث بشأن: ${input.title}\n${excerpt}\n\nYou have an update about: ${input.title}\n${excerpt}` : secure; return { href: input.href, title: input.title, reason, recipientName: recipient.nameAr || recipient.nameEn, textBody: body, htmlBody: body.replace(/\n/g, '<br>'), subject: `تحديث جديد: ${input.title} | New update: ${input.title}` }; }
function emailPayload(payload: Prisma.InputJsonValue, to: string): Prisma.InputJsonValue { return { ...(payload as Prisma.InputJsonObject), to }; }
function digestPayload(payload: Prisma.JsonValue, count: number, to: string): Prisma.InputJsonValue { const source = plain(payload) ? payload : {}; const title = typeof source.title === 'string' ? source.title : 'السجل'; const href = typeof source.href === 'string' ? source.href : '/'; const textBody = `لديك ${count} تحديثات جديدة بشأن: ${title}\nافتح النظام لعرض التفاصيل.\n\nYou have ${count} new updates about: ${title}\nOpen the system to view details.`; return { href, title, to, subject: `تحديثات جديدة: ${title} | New updates: ${title}`, textBody, htmlBody: textBody.replace(/\n/g, '<br>') }; }
function plain(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }

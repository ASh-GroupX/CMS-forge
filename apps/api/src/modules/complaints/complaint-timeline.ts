import { CommentVisibility } from '@prisma/client';
import type { ComplaintTimelineItemDto } from './dto/complaint-response.dto.js';
import type { ComplaintTimelineFacts } from './complaints.repository.js';
import type { ComplaintDetailDto } from './dto/complaint-response.dto.js';

type TimelineTask = {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  ownerId: string;
  assigneeId: string | null;
  owner: { nameEn: string } | null;
  assignee: { nameEn: string } | null;
  statusHistory: Array<{ id: string; fromStatus: string | null; toStatus: string; actorId: string | null; correlationId: string | null; createdAt: Date; actor: { nameEn: string } | null }>;
  comments: Array<{ id: string; authorId: string; body: string; createdAt: Date; author: { nameEn: string } | null }>;
};

export function timelineItems(complaint: ComplaintDetailDto, facts: ComplaintTimelineFacts, tasks: TimelineTask[]): ComplaintTimelineItemDto[] {
  const items: ComplaintTimelineItemDto[] = [];
  for (const item of facts.statusHistory) {
    items.push({
      id: item.id,
      type: 'WORKFLOW',
      createdAt: item.createdAt.toISOString(),
      actor: actor(item.actorId, item.actor?.nameEn ?? null, item.actorRole),
      visibility: 'SYSTEM',
      customerVisible: false,
      summary: item.action ? `Workflow ${item.action}` : `Status changed to ${item.toStatus}`,
      body: item.reason,
      related: { type: 'complaint', id: complaint.id, label: complaint.referenceNumber },
      metadata: { action: item.action, fromStatus: item.fromStatus, toStatus: item.toStatus, correlationId: item.correlationId },
    });
  }
  for (const item of facts.comments) {
    items.push({
      id: item.id,
      type: 'COMMENT',
      createdAt: item.createdAt.toISOString(),
      actor: actor(item.authorId, item.author?.nameEn ?? null, null),
      visibility: item.visibility,
      customerVisible: item.visibility === CommentVisibility.PUBLIC,
      summary: item.visibility === CommentVisibility.PUBLIC ? 'Public customer update' : 'Internal staff note',
      body: item.body,
      related: { type: 'complaint', id: complaint.id, label: complaint.referenceNumber },
    });
  }
  addAttachmentItems(items, facts);
  addTaskItems(items, tasks);
  for (const item of facts.slaEvents) {
    items.push({
      id: item.id,
      type: 'SLA',
      createdAt: item.occurredAt.toISOString(),
      actor: null,
      visibility: 'SYSTEM',
      customerVisible: false,
      summary: `SLA ${item.type} for ${item.stage}`,
      related: { type: 'complaint', id: complaint.id, label: complaint.referenceNumber },
      metadata: { type: item.type, stage: item.stage, dueAt: item.dueAt?.toISOString() ?? null },
    });
  }
  for (const item of facts.notifications) {
    items.push({
      id: item.id,
      type: 'NOTIFICATION',
      createdAt: item.queuedAt.toISOString(),
      actor: actor(item.recipientUserId, item.recipientUser?.nameEn ?? null, null),
      visibility: 'SYSTEM',
      customerVisible: false,
      summary: `Notification queued: ${item.templateCode}`,
      related: { type: 'notification', id: item.id, label: item.templateCode },
      metadata: { status: item.status, readAt: item.sentAt?.toISOString() ?? null },
    });
  }
  return items.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

function addAttachmentItems(items: ComplaintTimelineItemDto[], facts: ComplaintTimelineFacts): void {
  const attachments = new Map(facts.attachments.map((item) => [item.id, item]));
  for (const item of facts.attachmentAudits) {
    const attachment = item.targetId ? attachments.get(item.targetId) : null;
    const metadata = objectMeta(item.metadata);
    const fileName = attachment?.fileName ?? stringMeta(metadata.fileName) ?? item.targetId ?? item.id;
    const upload = item.action === 'attachment_uploaded';
    items.push({
      id: item.id,
      type: 'ATTACHMENT',
      createdAt: item.createdAt.toISOString(),
      actor: actor(item.actorId, item.actor?.nameEn ?? null, null),
      visibility: upload && visibleMeta(metadata.customerVisible, attachment?.customerVisible) ? 'PUBLIC' : 'INTERNAL',
      customerVisible: upload && visibleMeta(metadata.customerVisible, attachment?.customerVisible),
      summary: attachmentSummary(item.action, fileName),
      related: { type: 'attachment', id: item.targetId ?? item.id, label: fileName },
      metadata: {
        action: item.action,
        contentType: attachment?.contentType ?? stringMeta(metadata.contentType) ?? null,
        sizeBytes: attachment?.sizeBytes ?? numberMeta(metadata.sizeBytes) ?? null,
        scanStatus: attachment?.scanStatus ?? stringMeta(metadata.toStatus) ?? null,
      },
    });
  }
}

function addTaskItems(items: ComplaintTimelineItemDto[], tasks: TimelineTask[]): void {
  for (const task of tasks) {
    items.push({ id: task.id, type: 'TASK', createdAt: task.createdAt.toISOString(), actor: actor(task.ownerId, task.owner?.nameEn ?? null, null), visibility: 'INTERNAL', customerVisible: false, summary: `Task created: ${task.title}`, related: { type: 'task', id: task.id, label: task.title }, metadata: { status: task.status, assigneeId: task.assigneeId, assigneeName: task.assignee?.nameEn ?? null } });
    for (const status of task.statusHistory) {
      items.push({ id: status.id, type: 'TASK_STATUS', createdAt: status.createdAt.toISOString(), actor: actor(status.actorId, status.actor?.nameEn ?? null, null), visibility: 'INTERNAL', customerVisible: false, summary: `Task status changed to ${status.toStatus}`, related: { type: 'task', id: task.id, label: task.title }, metadata: { fromStatus: status.fromStatus, toStatus: status.toStatus, correlationId: status.correlationId } });
    }
    for (const comment of task.comments) {
      items.push({ id: comment.id, type: 'TASK_COMMENT', createdAt: comment.createdAt.toISOString(), actor: actor(comment.authorId, comment.author?.nameEn ?? null, null), visibility: 'INTERNAL', customerVisible: false, summary: `Task note: ${task.title}`, body: comment.body, related: { type: 'task', id: task.id, label: task.title } });
    }
  }
}

function attachmentSummary(action: string, fileName: string): string {
  if (action === 'attachment_uploaded') return `Attachment uploaded: ${fileName}`;
  if (action === 'attachment_download_prepared') return `Attachment download prepared: ${fileName}`;
  if (action.startsWith('attachment_scan_')) return `Attachment scan ${action.replace('attachment_scan_', '')}: ${fileName}`;
  return `Attachment event: ${fileName}`;
}

function actor(id: string | null, name: string | null, role: string | null): ComplaintTimelineItemDto['actor'] {
  return id || name || role ? { id, name, role } : null;
}

function objectMeta(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringMeta(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function numberMeta(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

function visibleMeta(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

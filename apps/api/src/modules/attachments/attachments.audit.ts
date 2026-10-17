import type { AuditRecordInput } from '../../core/audit.service.js';
import type { AttachmentRecord } from './attachments.repository.js';
import type { CreateAttachmentUploadInput, PrepareStaffAttachmentDownloadInput, TransitionAttachmentScanInput } from './attachments.service.js';

export function uploadAudit(input: CreateAttachmentUploadInput, attachment: AttachmentRecord): AuditRecordInput {
  return {
    eventType: 'ATTACHMENT',
    action: 'attachment_uploaded',
    actorId: input.actorId ?? input.uploadedById ?? null,
    branchId: input.branchId ?? null,
    targetType: 'attachment',
    targetId: attachment.id,
    correlationId: input.correlationId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: {
      complaintId: attachment.complaintId,
      contentType: attachment.contentType,
      sizeBytes: attachment.sizeBytes,
      customerVisible: attachment.customerVisible,
    },
  };
}

export function downloadAudit(input: PrepareStaffAttachmentDownloadInput, attachment: AttachmentRecord): AuditRecordInput {
  return {
    eventType: 'ATTACHMENT',
    action: 'attachment_download_prepared',
    actorId: input.actorId ?? null,
    branchId: input.branchId ?? null,
    targetType: 'attachment',
    targetId: attachment.id,
    correlationId: input.correlationId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: {
      complaintId: attachment.complaintId,
      contentType: attachment.contentType,
      sizeBytes: attachment.sizeBytes,
    },
  };
}

export function scanAudit(input: TransitionAttachmentScanInput, previous: AttachmentRecord, next: AttachmentRecord): AuditRecordInput {
  return {
    eventType: 'ATTACHMENT',
    action: `attachment_scan_${next.scanStatus.toLowerCase()}`,
    actorId: input.actorId ?? null,
    branchId: input.branchId ?? null,
    targetType: 'attachment',
    targetId: next.id,
    correlationId: input.correlationId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: {
      complaintId: next.complaintId,
      fromStatus: previous.scanStatus,
      toStatus: next.scanStatus,
    },
  };
}

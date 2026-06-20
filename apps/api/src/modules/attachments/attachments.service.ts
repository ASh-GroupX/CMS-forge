import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { ATTACHMENT_STORAGE } from './attachment-storage.port.js';
import type { AttachmentDownloadToken, AttachmentStoragePort, AttachmentStoredObject, AttachmentStorageObjectInput } from './attachment-storage.port.js';
import { AttachmentsRepository } from './attachments.repository.js';
import type { AttachmentRecord } from './attachments.repository.js';

export type AttachmentUploadMetadata = {
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export type AttachmentKind = 'image' | 'pdf' | 'audio' | 'video';

export type AttachmentUploadPolicy = AttachmentUploadMetadata & {
  extension: string;
  kind: AttachmentKind;
  maxSizeBytes: number;
};

export type CreateAttachmentUploadInput = AttachmentUploadMetadata & {
  complaintId: string;
  bytes: Uint8Array;
  uploadedById?: string | null;
  customerVisible?: boolean;
  actorId?: string | null;
  branchId?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AttachmentUploadResult = {
  id: string;
  complaintId: string;
  storageKey: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  scanStatus: string;
  customerVisible: boolean;
};

export type PrepareStaffAttachmentDownloadInput = {
  complaintId: string;
  attachmentId: string;
  actorId?: string | null;
  branchId?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AttachmentDownloadResult = {
  attachmentId: string;
  token: string;
  expiresAt: Date;
};

export type TransitionAttachmentScanInput = {
  attachmentId: string;
  toStatus: 'CLEAN' | 'REJECTED';
  actorId?: string | null;
  branchId?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly auditService: AuditService,
    @Inject(ATTACHMENT_STORAGE) private readonly storage: AttachmentStoragePort,
  ) {}

  validateUploadMetadata(input: AttachmentUploadMetadata): AttachmentUploadPolicy {
    const fileName = input.fileName.trim();
    const contentType = input.contentType.trim().toLowerCase();
    const extension = fileName.split('.').pop()?.toLowerCase();
    const policy = extension ? allowedTypes[contentType]?.[extension] : undefined;

    if (!fileName || !extension || !policy || !Number.isSafeInteger(input.sizeBytes) || input.sizeBytes <= 0) {
      throw blockedType();
    }

    if (input.sizeBytes > policy.maxSizeBytes) {
      throw new AppException('ATTACHMENT_SIZE_EXCEEDED', 'File exceeds size limit', HttpStatus.BAD_REQUEST);
    }

    return { fileName, contentType, sizeBytes: input.sizeBytes, extension, ...policy };
  }

  storeObject(input: AttachmentStorageObjectInput): Promise<AttachmentStoredObject> {
    return this.storage.putObject(input);
  }

  prepareDownload(storageKey: string): Promise<AttachmentDownloadToken> {
    return this.storage.createDownloadToken(storageKey);
  }

  async createUpload(input: CreateAttachmentUploadInput): Promise<AttachmentUploadResult> {
    const complaintId = requiredText(input.complaintId, 'complaintId');
    const policy = this.validateUploadMetadata(input);
    const stored = await this.storeObject({ bytes: input.bytes, contentType: policy.contentType });

    return this.attachmentsRepository.transaction(async (client) => {
      const attachment = await this.attachmentsRepository.createMetadata({
        complaintId,
        uploadedById: input.uploadedById ?? null,
        storageKey: stored.storageKey,
        fileName: policy.fileName,
        contentType: policy.contentType,
        sizeBytes: policy.sizeBytes,
        customerVisible: input.customerVisible ?? false,
      }, client);
      await this.auditService.record(uploadAudit(input, attachment), client);
      return uploadResult(attachment);
    });
  }

  async prepareStaffDownload(input: PrepareStaffAttachmentDownloadInput): Promise<AttachmentDownloadResult> {
    const attachment = await this.attachmentsRepository.findMetadata(input.attachmentId);
    if (!attachment || attachment.complaintId !== input.complaintId) throw attachmentNotFound();
    if (attachment.scanStatus !== 'CLEAN') throw scanUnavailable();
    const download = await this.prepareDownload(attachment.storageKey);
    await this.attachmentsRepository.transaction((client) => this.auditService.record(downloadAudit(input, attachment), client));
    return { attachmentId: attachment.id, token: download.token, expiresAt: download.expiresAt };
  }

  async transitionScanStatus(input: TransitionAttachmentScanInput): Promise<AttachmentUploadResult> {
    if (input.toStatus !== 'CLEAN' && input.toStatus !== 'REJECTED') throw invalidScanTransition();
    const current = await this.attachmentsRepository.findMetadata(input.attachmentId);
    if (!current) throw attachmentNotFound();
    if (current.scanStatus !== 'PENDING') throw invalidScanTransition();

    return this.attachmentsRepository.transaction(async (client) => {
      const updated = await this.attachmentsRepository.updateScanStatus({ id: input.attachmentId, toStatus: input.toStatus }, client);
      if (!updated) throw invalidScanTransition();
      await this.auditService.record(scanAudit(input, current, updated), client);
      return uploadResult(updated);
    });
  }
}

const tenMb = 10 * 1024 * 1024;
const fiftyMb = 50 * 1024 * 1024;

const allowedTypes: Record<string, Partial<Record<string, { kind: AttachmentKind; maxSizeBytes: number }>>> = {
  'image/jpeg': { jpg: { kind: 'image', maxSizeBytes: tenMb }, jpeg: { kind: 'image', maxSizeBytes: tenMb } },
  'image/png': { png: { kind: 'image', maxSizeBytes: tenMb } },
  'image/webp': { webp: { kind: 'image', maxSizeBytes: tenMb } },
  'application/pdf': { pdf: { kind: 'pdf', maxSizeBytes: tenMb } },
  'audio/mpeg': { mp3: { kind: 'audio', maxSizeBytes: fiftyMb } },
  'audio/wav': { wav: { kind: 'audio', maxSizeBytes: fiftyMb } },
  'audio/ogg': { ogg: { kind: 'audio', maxSizeBytes: fiftyMb } },
  'video/mp4': { mp4: { kind: 'video', maxSizeBytes: fiftyMb } },
  'video/quicktime': { mov: { kind: 'video', maxSizeBytes: fiftyMb } },
  'video/webm': { webm: { kind: 'video', maxSizeBytes: fiftyMb } },
};

function blockedType(): AppException {
  return new AppException('ATTACHMENT_TYPE_BLOCKED', 'File type is not allowed', HttpStatus.BAD_REQUEST);
}

function attachmentNotFound(): AppException {
  return new AppException('ATTACHMENT_NOT_FOUND', 'Attachment was not found', HttpStatus.NOT_FOUND);
}

function invalidScanTransition(): AppException {
  return new AppException('ATTACHMENT_SCAN_INVALID_TRANSITION', 'Attachment scan transition is not allowed', HttpStatus.CONFLICT);
}

function scanUnavailable(): AppException {
  return new AppException('ATTACHMENT_SCAN_UNAVAILABLE', 'Attachment is not available for download', HttpStatus.CONFLICT);
}

function requiredText(value: string, field: string): string {
  const text = value.trim();
  if (!text) throw new AppException('VALIDATION_FAILED', 'Invalid attachment request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required.` },
  ]);
  return text;
}

function uploadResult(record: AttachmentRecord): AttachmentUploadResult {
  return {
    id: record.id,
    complaintId: record.complaintId,
    storageKey: record.storageKey,
    fileName: record.fileName,
    contentType: record.contentType,
    sizeBytes: record.sizeBytes,
    scanStatus: record.scanStatus,
    customerVisible: record.customerVisible,
  };
}

function uploadAudit(input: CreateAttachmentUploadInput, attachment: AttachmentRecord): AuditRecordInput {
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

function downloadAudit(input: PrepareStaffAttachmentDownloadInput, attachment: AttachmentRecord): AuditRecordInput {
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

function scanAudit(input: TransitionAttachmentScanInput, previous: AttachmentRecord, next: AttachmentRecord): AuditRecordInput {
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

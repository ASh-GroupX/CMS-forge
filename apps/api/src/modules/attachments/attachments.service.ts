import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../core/http-kernel.js';
import { AttachmentsRepository } from './attachments.repository.js';

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

@Injectable()
export class AttachmentsService {
  constructor(private readonly attachmentsRepository: AttachmentsRepository) {}

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

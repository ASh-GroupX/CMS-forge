import type { AttachmentUploadResult } from '../attachments.service.js';
import type { AttachmentDownloadResult } from '../attachments.service.js';

export type AttachmentDto = {
  id: string;
  complaintId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  scanStatus: string;
  customerVisible: boolean;
};

export type AttachmentUploadResponseDto = {
  attachment: AttachmentDto;
};

export type AttachmentDownloadResponseDto = {
  download: {
    attachmentId: string;
    token: string;
    expiresAt: string;
  };
};

export function attachmentDto(attachment: AttachmentUploadResult): AttachmentDto {
  return {
    id: attachment.id,
    complaintId: attachment.complaintId,
    fileName: attachment.fileName,
    contentType: attachment.contentType,
    sizeBytes: attachment.sizeBytes,
    scanStatus: attachment.scanStatus,
    customerVisible: attachment.customerVisible,
  };
}

export function attachmentDownloadDto(download: AttachmentDownloadResult): AttachmentDownloadResponseDto['download'] {
  return {
    attachmentId: download.attachmentId,
    token: download.token,
    expiresAt: download.expiresAt.toISOString(),
  };
}

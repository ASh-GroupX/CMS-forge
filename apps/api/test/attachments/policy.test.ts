import assert from 'node:assert/strict';
import test from 'node:test';
import { AppException } from '../../src/core/http-kernel.ts';
import { AttachmentsRepository } from '../../src/modules/attachments/attachments.repository.ts';
import { AttachmentsService } from '../../src/modules/attachments/attachments.service.ts';

const service = new AttachmentsService(new AttachmentsRepository());

test('attachment policy accepts allowed image, PDF, audio, and video metadata within limits', () => {
  assert.equal(service.validateUploadMetadata({ fileName: 'photo.JPG', contentType: 'image/jpeg', sizeBytes: mb(10) }).kind, 'image');
  assert.equal(service.validateUploadMetadata({ fileName: 'repair.pdf', contentType: 'application/pdf', sizeBytes: mb(10) }).kind, 'pdf');
  assert.equal(service.validateUploadMetadata({ fileName: 'call.mp3', contentType: 'audio/mpeg', sizeBytes: mb(50) }).kind, 'audio');
  assert.equal(service.validateUploadMetadata({ fileName: 'walkaround.mp4', contentType: 'video/mp4', sizeBytes: mb(50) }).kind, 'video');
});

test('attachment policy rejects executable metadata before storage or persistence', () => {
  assertDenied({ fileName: 'invoice.exe', contentType: 'application/x-msdownload', sizeBytes: 100 }, 'ATTACHMENT_TYPE_BLOCKED');
});

test('attachment policy rejects oversize metadata before storage or persistence', () => {
  assertDenied({ fileName: 'photo.png', contentType: 'image/png', sizeBytes: mb(10) + 1 }, 'ATTACHMENT_SIZE_EXCEEDED');
  assertDenied({ fileName: 'walkaround.mp4', contentType: 'video/mp4', sizeBytes: mb(50) + 1 }, 'ATTACHMENT_SIZE_EXCEEDED');
});

test('attachment policy rejects mismatched extension and content type before storage or persistence', () => {
  assertDenied({ fileName: 'photo.jpg', contentType: 'application/pdf', sizeBytes: 100 }, 'ATTACHMENT_TYPE_BLOCKED');
  assertDenied({ fileName: 'repair.pdf', contentType: 'image/png', sizeBytes: 100 }, 'ATTACHMENT_TYPE_BLOCKED');
});

function assertDenied(input: Parameters<AttachmentsService['validateUploadMetadata']>[0], code: string): void {
  assert.throws(
    () => service.validateUploadMetadata(input),
    (error: unknown) => error instanceof AppException && error.code === code,
  );
}

function mb(value: number): number {
  return value * 1024 * 1024;
}

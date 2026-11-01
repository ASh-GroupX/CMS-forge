import assert from 'node:assert/strict';
import test from 'node:test';
import { AppException } from '../../src/core/http-kernel.ts';
import { validateTicketImageAttachment } from '../../src/modules/internal-tickets/internal-tickets.service.ts';

function upload(fileName: string, contentType: string, sizeBytes = 5) {
  return { fileName, contentType, sizeBytes, contentBase64: 'cGhvdG8=' };
}

test('internal ticket uploads accept supported photo formats and preserve MIME types', () => {
  assert.equal(validateTicketImageAttachment(upload('photo.jpg', 'image/jpeg')), 'image/jpeg');
  assert.equal(validateTicketImageAttachment(upload('photo.png', 'image/png')), 'image/png');
  assert.equal(validateTicketImageAttachment(upload('photo.webp', 'image/webp')), 'image/webp');
});

test('internal ticket uploads reject mismatched, unsupported, and oversized image metadata', () => {
  assert.throws(
    () => validateTicketImageAttachment(upload('photo.png', 'image/jpeg')),
    (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_TYPE_BLOCKED',
  );
  assert.throws(
    () => validateTicketImageAttachment(upload('photo.gif', 'image/gif')),
    (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_TYPE_BLOCKED',
  );
  assert.throws(
    () => validateTicketImageAttachment(upload('photo.png', 'image/png', 5 * 1024 * 1024 + 1)),
    (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_SIZE_EXCEEDED',
  );
});

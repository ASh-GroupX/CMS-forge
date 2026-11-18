import assert from 'node:assert/strict';
import test from 'node:test';
import { AppException } from '../../src/core/http-kernel.ts';
import { validateTicketAttachment } from '../../src/modules/internal-tickets/internal-tickets.service.ts';

function upload(fileName: string, contentType: string, bytes = Buffer.from('photo'), sizeBytes = bytes.byteLength) {
  return { fileName, contentType, sizeBytes, contentBase64: bytes.toString('base64') };
}

test('internal ticket uploads accept supported image and PDF formats and preserve MIME types', () => {
  assert.equal(validateTicketAttachment(upload('photo.jpg', 'image/jpeg')), 'image/jpeg');
  assert.equal(validateTicketAttachment(upload('photo.png', 'image/png')), 'image/png');
  assert.equal(validateTicketAttachment(upload('photo.webp', 'image/webp')), 'image/webp');
  assert.equal(validateTicketAttachment(upload('request.pdf', 'application/pdf', Buffer.from('%PDF-1.7'))), 'application/pdf');
});

test('internal ticket uploads reject mismatched, unsupported, and oversized attachment metadata', () => {
  assert.throws(
    () => validateTicketAttachment(upload('photo.png', 'image/jpeg')),
    (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_TYPE_BLOCKED',
  );
  assert.throws(
    () => validateTicketAttachment(upload('photo.gif', 'image/gif')),
    (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_TYPE_BLOCKED',
  );
  assert.throws(
    () => validateTicketAttachment(upload('request.pdf', 'image/png', Buffer.from('%PDF-1.7'))),
    (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_TYPE_BLOCKED',
  );
  assert.throws(
    () => validateTicketAttachment(upload('request.pdf', 'application/pdf', Buffer.from('MZ executable'))),
    (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_TYPE_BLOCKED',
  );
  assert.throws(
    () => validateTicketAttachment(upload('photo.png', 'image/png', Buffer.from('photo'), 5 * 1024 * 1024 + 1)),
    (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_SIZE_EXCEEDED',
  );
});

test('internal ticket uploads enforce the 5MB limit against decoded server bytes', () => {
  assert.throws(
    () => validateTicketAttachment(upload('photo.png', 'image/png', Buffer.alloc(5 * 1024 * 1024 + 1), 1)),
    (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_SIZE_EXCEEDED',
  );
});

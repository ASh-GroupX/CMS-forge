import assert from 'node:assert/strict';
import test from 'node:test';
import { AttachmentsRepository } from './attachments.repository.js';
import { AttachmentsService } from './attachments.service.js';

test('attachments service can be constructed', () => {
  assert.ok(new AttachmentsService(new AttachmentsRepository()));
});

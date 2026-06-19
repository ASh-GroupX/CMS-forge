import assert from 'node:assert/strict';
import test from 'node:test';
import { AttachmentsController } from './attachments.controller.js';
import { AttachmentsRepository } from './attachments.repository.js';
import { AttachmentsService } from './attachments.service.js';

test('attachments controller can be constructed', () => {
  assert.ok(new AttachmentsController(new AttachmentsService(new AttachmentsRepository())));
});

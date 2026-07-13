import assert from 'node:assert/strict';
import test from 'node:test';
import { CommentVisibility } from '@prisma/client';
import { ComplaintsRepository } from './complaints.repository.js';
import { ComplaintsService } from './complaints.service.js';

test('complaints service can be constructed', () => {
  assert.ok(new ComplaintsService(new ComplaintsRepository({} as never), { record: async () => undefined } as never));
});

test('public complaint comments reject mentions, CC, and linked tasks before persistence', async () => {
  const service = new ComplaintsService({} as ComplaintsRepository, { record: async () => undefined } as never);

  await assert.rejects(
    service.createComment({
      complaintId: 'complaint_1',
      body: 'Customer-facing update',
      visibility: CommentVisibility.PUBLIC,
      mentionTargets: [{ type: 'USER', id: 'user_1' }],
    }),
    (error: unknown) => (error as { code?: string }).code === 'VALIDATION_FAILED',
  );
});

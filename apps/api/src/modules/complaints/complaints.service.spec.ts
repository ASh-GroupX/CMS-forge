import assert from 'node:assert/strict';
import test from 'node:test';
import { ComplaintsRepository } from './complaints.repository.js';
import { ComplaintsService } from './complaints.service.js';

test('complaints service can be constructed', () => {
  assert.ok(new ComplaintsService(new ComplaintsRepository({} as never), { record: async () => undefined } as never));
});

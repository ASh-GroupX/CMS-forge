import assert from 'node:assert/strict';
import test from 'node:test';
import { InternalTicketsRepository } from './internal-tickets.repository.js';
import { InternalTicketsService } from './internal-tickets.service.js';

test('internal-tickets service can be constructed', () => {
  assert.ok(new InternalTicketsService(new InternalTicketsRepository(null as any), null as any));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { InternalTicketsController } from './internal-tickets.controller.js';
import { InternalTicketsRepository } from './internal-tickets.repository.js';
import { InternalTicketsService } from './internal-tickets.service.js';

test('internal-tickets controller can be constructed', () => {
  assert.ok(new InternalTicketsController(new InternalTicketsService(new InternalTicketsRepository(null as any), null as any)));
});

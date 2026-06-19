import assert from 'node:assert/strict';
import test from 'node:test';
import { SlaRepository } from './sla.repository.js';
import { SlaService } from './sla.service.js';

test('sla service can be constructed', () => {
  assert.ok(new SlaService({} as SlaRepository));
});

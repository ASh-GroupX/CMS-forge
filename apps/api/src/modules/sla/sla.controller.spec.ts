import assert from 'node:assert/strict';
import test from 'node:test';
import { SlaController } from './sla.controller.js';
import { SlaRepository } from './sla.repository.js';
import { SlaService } from './sla.service.js';

test('sla controller can be constructed', () => {
  assert.ok(new SlaController(new SlaService({} as SlaRepository)));
});

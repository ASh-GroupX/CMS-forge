import assert from 'node:assert/strict';
import test from 'node:test';
import { ComplaintsController } from './complaints.controller.js';
import { ComplaintFormOptionsService } from './complaint-form-options.service.js';
import { ComplaintsRepository } from './complaints.repository.js';
import { ComplaintsService } from './complaints.service.js';

test('complaints controller can be constructed', () => {
  assert.ok(new ComplaintsController(
    new ComplaintsService(new ComplaintsRepository({} as never), { record: async () => undefined } as never),
    new ComplaintFormOptionsService({} as never),
  ));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { ComplaintsController } from './complaints.controller.js';
import { ComplaintFormOptionsService } from './complaint-form-options.service.js';
import { ComplaintRelationsRepository } from './complaint-relations.repository.js';
import { ComplaintRelationsService } from './complaint-relations.service.js';
import { ComplaintsBoardRepository } from './complaints.board.repository.js';
import { ComplaintsBoardService } from './complaints.board.service.js';
import { ComplaintsRepository } from './complaints.repository.js';
import { ComplaintsService } from './complaints.service.js';

test('complaints controller can be constructed', () => {
  const complaints = new ComplaintsService(new ComplaintsRepository({} as never), { record: async () => undefined } as never);
  assert.ok(new ComplaintsController(
    complaints,
    new ComplaintFormOptionsService({} as never),
    new ComplaintRelationsService(new ComplaintRelationsRepository({} as never), { record: async () => undefined } as never),
    new ComplaintsBoardService(new ComplaintsBoardRepository({} as never), complaints),
  ));
});

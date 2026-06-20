import assert from 'node:assert/strict';
import test from 'node:test';
import { CasesController } from './cases.controller.js';
import { CasesRepository } from './cases.repository.js';
import { CasesService } from './cases.service.js';

test('cases controller can be constructed', () => {
  assert.ok(new CasesController(new CasesService(new CasesRepository({} as never))));
});

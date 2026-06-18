import assert from 'node:assert/strict';
import test from 'node:test';
import { BranchesController } from './branches.controller.js';
import { BranchesRepository } from './branches.repository.js';
import { BranchesService } from './branches.service.js';

test('branches controller can be constructed', () => {
  assert.ok(new BranchesController(new BranchesService(new BranchesRepository())));
});

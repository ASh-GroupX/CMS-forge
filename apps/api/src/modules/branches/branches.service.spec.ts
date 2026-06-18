import assert from 'node:assert/strict';
import test from 'node:test';
import { BranchesRepository } from './branches.repository.js';
import { BranchesService } from './branches.service.js';

test('branches service can be constructed', () => {
  assert.ok(new BranchesService(new BranchesRepository()));
});

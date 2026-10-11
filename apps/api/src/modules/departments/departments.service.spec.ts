import assert from 'node:assert/strict';
import test from 'node:test';
import { DepartmentsRepository } from './departments.repository.js';
import { DepartmentsService } from './departments.service.js';

test('departments service can be constructed', () => {
  assert.ok(new DepartmentsService(new DepartmentsRepository({} as never), {} as never));
});

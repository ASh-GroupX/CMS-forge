import assert from 'node:assert/strict';
import test from 'node:test';
import { DepartmentsController } from './departments.controller.js';
import { DepartmentsRepository } from './departments.repository.js';
import { DepartmentsService } from './departments.service.js';

test('departments controller can be constructed', () => {
  assert.ok(new DepartmentsController(new DepartmentsService(new DepartmentsRepository({} as never), {} as never)));
});

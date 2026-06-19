import assert from 'node:assert/strict';
import test from 'node:test';
import { ReportsController } from './reports.controller.js';
import { ReportsRepository } from './reports.repository.js';
import { ReportsService } from './reports.service.js';

test('reports controller can be constructed', () => {
  assert.ok(new ReportsController(new ReportsService(new ReportsRepository())));
});

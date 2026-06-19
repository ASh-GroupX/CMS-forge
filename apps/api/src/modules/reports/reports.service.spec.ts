import assert from 'node:assert/strict';
import test from 'node:test';
import { ReportsRepository } from './reports.repository.js';
import { ReportsService } from './reports.service.js';

test('reports service can be constructed', () => {
  assert.ok(new ReportsService(new ReportsRepository()));
});

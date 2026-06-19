import assert from 'node:assert/strict';
import test from 'node:test';
import type { ComplaintsService } from '../complaints/complaints.service.js';
import type { SlaService } from '../sla/sla.service.js';
import type { SurveysService } from '../surveys/surveys.service.js';
import { ReportsRepository } from './reports.repository.js';
import { ReportsService } from './reports.service.js';

test('reports service can be constructed', () => {
  assert.ok(
    new ReportsService(
      new ReportsRepository(),
      {} as ComplaintsService,
      {} as SlaService,
      {} as SurveysService,
    ),
  );
});

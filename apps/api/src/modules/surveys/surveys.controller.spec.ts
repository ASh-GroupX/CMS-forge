import assert from 'node:assert/strict';
import test from 'node:test';
import { ComplaintsService } from '../complaints/complaints.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ComplaintSurveysController, SurveysController } from './surveys.controller.js';
import { SurveysRepository } from './surveys.repository.js';
import { SurveysService } from './surveys.service.js';

test('surveys controller can be constructed', () => {
  assert.ok(new SurveysController(new SurveysService(new SurveysRepository({} as never), {} as NotificationsService)));
  assert.ok(new ComplaintSurveysController(new SurveysService(new SurveysRepository({} as never), {} as NotificationsService), {} as ComplaintsService));
});

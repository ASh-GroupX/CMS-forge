import assert from 'node:assert/strict';
import test from 'node:test';
import { NotificationsService } from '../notifications/notifications.service.js';
import { SurveysRepository } from './surveys.repository.js';
import { SurveysService } from './surveys.service.js';

test('surveys service can be constructed', () => {
  assert.ok(new SurveysService(new SurveysRepository({} as never), {} as NotificationsService));
});

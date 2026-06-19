import assert from 'node:assert/strict';
import test from 'node:test';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsRepository } from './notifications.repository.js';
import { NotificationsService } from './notifications.service.js';

test('notifications controller can be constructed', () => {
  assert.ok(new NotificationsController(new NotificationsService(new NotificationsRepository({} as never))));
});

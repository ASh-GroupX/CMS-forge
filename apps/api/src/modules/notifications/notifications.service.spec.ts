import assert from 'node:assert/strict';
import test from 'node:test';
import { NotificationsRepository } from './notifications.repository.js';
import { NotificationsService } from './notifications.service.js';

test('notifications service can be constructed', () => {
  assert.ok(new NotificationsService(new NotificationsRepository({} as never)));
});

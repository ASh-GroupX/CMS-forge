import assert from 'node:assert/strict';
import test from 'node:test';
import { ServiceBookingsController } from './service-bookings.controller.js';
import { ServiceBookingsRepository } from './service-bookings.repository.js';
import { ServiceBookingsService } from './service-bookings.service.js';

test('service-bookings controller can be constructed', () => {
  assert.ok(new ServiceBookingsController(new ServiceBookingsService(new ServiceBookingsRepository(null as any))));
});

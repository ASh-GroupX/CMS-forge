import assert from 'node:assert/strict';
import test from 'node:test';
import { serviceBookingWindow } from '../../src/lib/service-booking-window';

test('booking calendar loads the selected month and its neighboring months', () => {
  assert.deepEqual(serviceBookingWindow('2026-11-21'), { fromDate: '2026-10-01', toDate: '2026-12-31' });
  assert.deepEqual(serviceBookingWindow('2027-01-02'), { fromDate: '2026-12-01', toDate: '2027-02-28' });
});

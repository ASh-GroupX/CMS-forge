import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appointmentStatusStyle,
  getNowTimeParts,
  getTodayDateString,
  matchesBranch,
} from '../../src/app/(staff)/service-booking/service-booking-utils';
import type { ServiceAppointment } from '../../src/lib/staff-service-bookings-api';

test('getTodayDateString returns a valid YYYY-MM-DD date format', () => {
  const today = getTodayDateString('Asia/Amman');
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
});

test('getNowTimeParts returns valid numeric hour and minute', () => {
  const { hour, minute } = getNowTimeParts('Asia/Amman');
  assert.ok(typeof hour === 'number' && hour >= 0 && hour <= 23);
  assert.ok(typeof minute === 'number' && minute >= 0 && minute <= 59);
});

test('matchesBranch matches branches by ID and standard center codes', () => {
  const apt: ServiceAppointment = {
    id: 'apt-1',
    referenceNumber: 'SB-001',
    branchId: 'center_main',
    customerName: 'Ahmad Test',
    customerPhone: '0790000000',
    carModelId: 'car-1',
    carModelName: 'Tiggo 8 Pro',
    maintenanceTypeId: 'mt-1',
    maintenanceTypeName: 'Periodic 10k',
    notes: '',
    date: '2026-11-02',
    startTime: '10:00',
    endTime: '10:30',
    durationMinutes: 30,
    status: 'BOOKED',
  };

  assert.strictEqual(matchesBranch(apt, { id: 'center_main', code: 'MAIN_CENTER' }), true);
  assert.strictEqual(matchesBranch(apt, { id: 'center_north', code: 'NORTH_CENTER' }), false);

  const aptWithCode: ServiceAppointment = {
    ...apt,
    branchId: '',
    serviceCenterId: 'MAIN_CENTER',
  };
  assert.strictEqual(matchesBranch(aptWithCode, { id: 'center_main', code: 'MAIN_CENTER' }), true);
});

test('appointmentStatusStyle maps appointment statuses to distinctive styles', () => {
  assert.ok(appointmentStatusStyle('CONFIRMED').includes('sky-500'));
  assert.ok(appointmentStatusStyle('IN_SERVICE').includes('status-warning'));
  assert.ok(appointmentStatusStyle('COMPLETED').includes('status-success'));
  assert.ok(appointmentStatusStyle('CANCELLED').includes('line-through'));
  assert.ok(appointmentStatusStyle('NO_SHOW').includes('purple-500'));
  assert.ok(appointmentStatusStyle('BOOKED').includes('border-brand'));
});

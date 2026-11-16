import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAmmanCustomerNotes, findAmmanNotesToClean, parseAmmanNotesRows, planAmmanNotesImport, sourceMarker } from '../../src/lib/amman-notes-import';
import type { ServiceAppointment } from '../../src/lib/staff-service-bookings-api';
import type { ServiceBookingLane } from '../../src/lib/staff-service-booking-lanes-api';

const base = {
  sourceKey: '2026-11-19-B2-1', date: '2026-11-19', hour: '09:00', suggestedStart: '09:00',
  customerName: 'Test Customer', customerPhone: '0791234567', carType: 'Mage', originalText: 'Original note',
};
const lane = { id: 'notes', maxDailyAppointments: 70, maxPerHour: 9, maxPerSlot: 3 } as ServiceBookingLane;

test('rejects duplicate source keys and invalid phone values', () => {
  assert.throws(() => parseAmmanNotesRows([base, base]), /Invalid booking row/);
  assert.throws(() => parseAmmanNotesRows([{ ...base, customerPhone: '079123' }]), /Invalid booking row/);
  assert.equal(parseAmmanNotesRows([base]).length, 1);
});

test('plans only unimported, unmapped-free rows within slot capacity', () => {
  const existing = [{ date: '2026-11-19', startTime: '09:00', status: 'BOOKED', bookingLaneId: 'notes',
    customerPhone: '0799999999', notes: sourceMarker('2026-11-19-B2-2') }] as ServiceAppointment[];
  const rows = parseAmmanNotesRows([
    base,
    { ...base, sourceKey: '2026-11-19-B2-2', customerPhone: '0791234568' },
    { ...base, sourceKey: '2026-11-19-B2-3', customerPhone: '0791234569', carType: 'Nami' },
  ]);
  const plan = planAmmanNotesImport(rows, existing, { ...lane, maxPerSlot: 1 }, { Mage: 'car-mage' });
  assert.equal(plan[0]?.startTime, '09:15');
  assert.equal(plan[1]?.reason, 'already-imported');
  assert.equal(plan[2]?.reason, 'model-unmapped');
});

test('marks an existing same-hour phone as possible duplicate', () => {
  const existing = [{ date: '2026-11-19', startTime: '09:30', status: 'BOOKED', bookingLaneId: 'notes',
    customerPhone: base.customerPhone, notes: 'Another booking' }] as ServiceAppointment[];
  const plan = planAmmanNotesImport([base], existing, lane, { Mage: 'car-mage' });
  assert.equal(plan[0]?.reason, 'possible-duplicate');
});

test('saves only the original text and still recognizes a cleaned import', () => {
  const row = { ...base, originalText: 'Test Customer / 0791234567 / Mage / 20k / brake noise' };
  assert.equal(buildAmmanCustomerNotes(row), row.originalText);
  const existing = [{ id: 'created-1', date: row.date, startTime: row.hour, status: 'BOOKED', bookingLaneId: lane.id,
    customerName: row.customerName, customerPhone: row.customerPhone, notes: row.originalText }] as ServiceAppointment[];
  assert.equal(planAmmanNotesImport([row], existing, lane, { Mage: 'car-mage' })[0]?.reason, 'already-imported');
  assert.deepEqual(findAmmanNotesToClean([row], existing, lane.id), []);
});

test('cleans only matching imported notes and ignores other appointments', () => {
  const row = { ...base, originalText: 'Test Customer / 0791234567 / Mage / brake noise' };
  const legacy = `${sourceMarker(row.sourceKey)}\nNotes / Customer Requests: brake noise\nOriginal source: ${row.originalText}`;
  const item = { id: 'created-1', date: row.date, startTime: row.hour, bookingLaneId: lane.id,
    customerName: row.customerName, customerPhone: row.customerPhone, notes: legacy } as ServiceAppointment;
  assert.deepEqual(findAmmanNotesToClean([row], [item], lane.id), [{ appointmentId: item.id, row }]);
  assert.deepEqual(findAmmanNotesToClean([row], [{ ...item, customerPhone: '0790000000' }], lane.id), []);
  assert.deepEqual(findAmmanNotesToClean([row], [{ ...item, notes: 'Staff edited this note' }], lane.id), []);
});

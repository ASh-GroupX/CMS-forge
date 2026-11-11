import assert from 'node:assert/strict';
import test from 'node:test';
import { ServiceBookingsRepository } from './service-bookings.repository.js';

test('appointment creation writes a metadata-only audit in the same transaction', async () => {
  const events: string[] = [];
  let audit: any;
  const client = {
    serviceAppointment: { create: async () => {
      events.push('appointment');
      return { id: 'apt-1', date: new Date('2026-11-12T00:00:00Z') };
    } },
    auditLog: { create: async ({ data }: any) => { events.push('audit'); audit = data; } },
  };
  const repository = new ServiceBookingsRepository({ $transaction: async (work: any) => {
    events.push('begin');
    const result = await work(client);
    events.push('commit');
    return result;
  } } as never);
  await repository.createAppointment({ serviceCenterId: 'main', startTime: '10:15',
    customerName: 'Private customer', customerPhone: '0790000000' } as never, 'staff-1');
  assert.deepEqual(events, ['begin', 'appointment', 'audit', 'commit']);
  assert.equal(audit.actorId, 'staff-1');
  assert.deepEqual(audit.metadata, { branchId: 'main', date: '2026-11-12', startTime: '10:15' });
  assert.equal(JSON.stringify(audit).includes('Private customer'), false);
  assert.equal(JSON.stringify(audit).includes('0790000000'), false);
});

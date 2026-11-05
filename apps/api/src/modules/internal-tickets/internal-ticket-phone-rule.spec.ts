import assert from 'node:assert/strict';
import test from 'node:test';
import { enforcePhoneRule, normalizeTicketPhone, phoneMatches, readableTicketScope } from './internal-ticket-phone-rule.js';
import { InternalTicketsService } from './internal-tickets.service.js';

const principal = { userId: 'staff-1', departmentId: 'dept-1', roleCode: 'CR_OFFICER' };
const field = { id: 'phone-field', nameEn: 'Customer phone', isRequired: true, phoneDuplicateCheck: true };
test('international phone normalization matches formatting, 00 prefix and Arabic digits', () => {
  for (const input of ['+962 79-000-0000', '00962(79)0000000', '+٩٦٢ ٧٩-٠٠٠-٠٠٠٠', '+۹۶۲ ۷۹-۰۰۰-۰۰۰۰']) assert.equal(normalizeTicketPhone(input), '+962790000000');
  for (const input of ['0790000000', '', '+0', '+962790000000ext4', 962790000000, undefined]) assert.throws(() => normalizeTicketPhone(input));
});
test('phone lookup uses exactly the existing ticket detail visibility boundary', async () => {
  assert.throws(() => readableTicketScope({ userId: '', roleCode: 'ADMIN' }));
  assert.deepEqual(readableTicketScope({ ...principal, roleCode: 'ADMIN' }), {});
  let where: any;
  const result = await phoneMatches({ ticketCustomerPhone: { findMany: async (query: any) => { where = query.where; assert.equal(query.take, 20); return [{ ticket: { id: 'allowed' } }]; } } } as any, '+962790000000', principal);
  assert.equal(where.phone, '+962790000000');
  assert.deepEqual(where.ticket.OR, [{ requestedById: 'staff-1' }, { assignedEmployeeId: 'staff-1' }, { targetDepartmentId: 'dept-1' }, { requestedBy: { departmentId: 'dept-1' } }]);
  assert.deepEqual(result, [{ id: 'allowed' }]);
  assert.deepEqual(readableTicketScope({ userId: 'staff-2', roleCode: 'CR_OFFICER' }), { OR: [{ requestedById: 'staff-2' }, { assignedEmployeeId: 'staff-2' }] });
});
test('create rechecks under lock, rejects duplicates until that field is explicitly acknowledged', async () => {
  const events: string[] = [];
  const tx = { $queryRaw: async () => events.push('locked'), ticketCustomerPhone: { findMany: async () => { events.push('checked'); return [{ ticket: { id: 'existing' } }]; } } } as any;
  await assert.rejects(() => enforcePhoneRule(tx, principal, [field], { 'phone-field': '+962790000000' }, []), (error: any) => error.code === 'DUPLICATE_CUSTOMER_PHONE' && error.getStatus() === 409);
  assert.deepEqual(events, ['locked', 'checked']);
  await assert.rejects(() => enforcePhoneRule(tx, principal, [field], { 'phone-field': '  ' }, ['phone-field']));
  const result = await enforcePhoneRule(tx, principal, [field], { 'phone-field': '+962 790000000' }, ['phone-field']);
  assert.deepEqual(result, [{ fieldId: 'phone-field', phone: '+962790000000' }]);
  await assert.rejects(() => enforcePhoneRule(tx, principal, [field], { 'phone-field': '+962790000000' }, ['other-field']));
});
test('admin phone rule forces text+required; unauthorized field configuration is denied', async () => {
  let data: any;
  const tx = { departmentTicketCustomField: { count: async () => 0, create: async (query: any) => { data = query.data; return data; } } };
  const service = new InternalTicketsService({ transaction: async (work: any) => work(tx) } as any, null as any);
  await assert.rejects(() => service.createDepartmentCustomField('dept-1', { nameEn: 'Phone', nameAr: 'هاتف', fieldType: 'NUMBER', phoneDuplicateCheck: true }, principal));
  await service.createDepartmentCustomField('dept-1', { nameEn: 'Phone', nameAr: 'هاتف', fieldType: 'NUMBER', phoneDuplicateCheck: true, isRequired: false }, { ...principal, roleCode: 'ADMIN' });
  assert.equal(data.phoneDuplicateCheck, true); assert.equal(data.fieldType, 'TEXT'); assert.equal(data.isRequired, true);
});
test('phone ticket creates normalized index, activity and audit in the same transaction', async () => {
  const writes: any[] = [];
  const tx = { $queryRaw: async () => [],
    departmentTicketCustomField: { findMany: async () => [field] }, userTicketRule: { findUnique: async () => null },
    ticketCustomerPhone: { findMany: async () => [], createMany: async (query: any) => writes.push(['phones', query.data]) },
    internalTicket: { create: async (query: any) => { writes.push(['ticket', query.data]); return { id: 'new-ticket' }; } },
    ticketActivity: { create: async () => writes.push(['activity']) }, auditLog: { create: async (query: any) => writes.push(['audit', query.data]) },
  };
  const service = new InternalTicketsService({ transaction: async (work: any) => work(tx) } as any, null as any);
  await service.create({ ...principal, roleCode: 'ADMIN' }, { title: 'New problem', description: 'Details', targetDepartmentId: 'dept-1', categoryId: 'cat-1', customFields: { 'phone-field': '+962 790000000' } });
  assert.deepEqual(writes.map(write => write[0]), ['ticket', 'activity', 'phones', 'audit']);
  assert.equal(writes[0][1].customFields['phone-field'], '+962790000000');
  assert.equal(writes[2][1][0].ticketId, 'new-ticket');
  assert.equal(JSON.stringify(writes[3]).includes('+962'), false);
});

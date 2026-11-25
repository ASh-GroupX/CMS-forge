import assert from 'node:assert/strict';
import test from 'node:test';
import { SearchRepository, internalTicketAccess } from '../../src/modules/search/search.repository.js';
import { SearchService } from '../../src/modules/search/search.service.js';

const officer = { userId: 'officer-1', roleCode: 'INTERNAL_OFFICER', branchId: 'branch-1', departmentId: 'dept-1' };

test('internal ticket search matches reference, title, description, notes, and phone inside officer scope', async () => {
  let query: any;
  const prisma = { internalTicket: { findMany: async (input: any) => {
    query = input;
    return [{ id: 'ticket-1', referenceNumber: 'TKT-123', title: 'Repair', targetDepartment: { nameEn: 'Service', nameAr: 'الخدمة' } }];
  } } };
  const result = await new SearchRepository(prisma as any).search('INTERNAL_TICKET', '0791234567', 8, officer);
  assert.equal(result[0]?.href, '/internal-tickets/ticket-1');
  assert.deepEqual(query.where.AND[0], internalTicketAccess(officer));
  assert.deepEqual(query.where.AND[1].OR.map((item: any) => Object.keys(item)[0]),
    ['referenceNumber', 'title', 'description', 'notes', 'customerPhones', 'customerPhones']);
  assert.deepEqual(query.where.AND[1].OR[3], { notes: { some: { content: { contains: '0791234567', mode: 'insensitive' } } } });
  assert.deepEqual(query.where.AND[1].OR[4], { customerPhones: { some: { phone: { contains: '0791234567' } } } });
  assert.deepEqual(query.where.AND[1].OR[5], { customerPhones: { some: { phone: { contains: '+962791234567' } } } });
});

test('ticket search denies unrelated tickets and assigned colleague tickets to an officer', () => {
  const scope = internalTicketAccess(officer);
  const allowed = [
    { requestedById: 'officer-1' },
    { assignedEmployeeId: 'officer-1' },
    { targetDepartmentId: 'dept-1', assignedEmployeeId: null, status: { in: ['ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RESOLVED'] } },
  ];
  assert.deepEqual(scope, { OR: allowed });
  assert.equal(scope.OR?.some((item) => item.targetDepartmentId === 'dept-2'), false);
  assert.equal(scope.OR?.some((item) => item.assignedEmployeeId === 'colleague-1'), false);
});

test('customer phone search accepts local and international forms and opens the customer', async () => {
  let query: any;
  const prisma = { customer: { findMany: async (input: any) => {
    query = input;
    return [{ id: 'customer-1', nameEn: 'Mona', nameAr: 'منى', phone: '+962791234567' }];
  } } };
  const result = await new SearchRepository(prisma as any).search('CUSTOMER', '0791234567', 8, officer);
  assert.equal(result[0]?.href, '/customers/customer-1');
  assert.deepEqual(query.where.complaints, { some: { branchId: 'branch-1' } });
  assert.ok(query.where.OR.some((item: any) => item.phone?.contains === '+962791234567'));
});

test('global results include customer and internal ticket before a full complaint group', async () => {
  const repository = { search: async (type: string) => Array.from({ length: type === 'COMPLAINT' ? 8 : type === 'CUSTOMER' || type === 'INTERNAL_TICKET' ? 1 : 0 }, (_, index) => ({
    type, id: `${type}-${index}`, label: type, labelAr: type, context: '', contextAr: '', href: '/',
  })) } as any;
  const result = await new SearchService(repository).search({ q: '0791234567', limit: 8 }, officer);
  assert.deepEqual(result.items.slice(0, 3).map((item) => item.type), ['CUSTOMER', 'INTERNAL_TICKET', 'COMPLAINT']);
  assert.equal(result.items.length, 8);
});

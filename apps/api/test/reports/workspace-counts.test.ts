import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { RoleCode } from '@prisma/client';
import { ReportsDepartmentsRepository } from '../../src/modules/reports/reports.departments.repository.js';
import { departmentRecordFilters } from '../../src/modules/reports/reports.department-filters.js';
import { buildComplaintWhere } from '../../src/modules/reports/reports.complaints.js';
import { buildTicketWhere } from '../../src/modules/reports/reports.tickets.js';
import { fetchComplaintsOfficersPerformance } from '../../src/modules/reports/reports.complaints.query.js';
import { fetchTicketsOfficersPerformance } from '../../src/modules/reports/reports.tickets.query.js';

const createdAt = new Date('2026-10-01');
const resolvedAt = new Date('2026-11-01');
const dates = { dateFrom: '2026-10-01', dateTo: '2026-10-31' };
test('kind-specific statuses cannot broaden the other kind', () => {
  assert.equal(departmentRecordFilters({ status: 'NEW' }).complaints.view, 'none');
  assert.equal(departmentRecordFilters({ status: 'SUBMITTED' }).tickets.view, 'none');
  assert.equal(departmentRecordFilters({ status: 'IN_PROGRESS', view: 'overdue' }).tickets.view, 'overdue');
});
for (const kind of ['tickets', 'complaints'] as const) test(`${kind} officer workload uses matching record scope, not employee home department or a 50-officer cap`, async () => {
  const filter = { ...dates, branchId: 'branch', departmentId: 'service', targetDepartmentId: 'service', search: 'repair', view: 'active' as const };
  const relation = kind === 'tickets' ? 'assignedInternalTickets' : 'ownedComplaints';
  const expected = kind === 'tickets' ? buildTicketWhere(filter) : buildComplaintWhere(filter);
  const prisma: any = { user: { findMany: async (query: any) => {
    assert.deepEqual(query.where, { [relation]: { some: expected } });
    assert.deepEqual(query.select[relation].where, expected);
    assert.equal(query.take, undefined);
    if (kind === 'tickets') assert.deepEqual(query.select.employeeTicketRatings.where, { ticket: expected });
    return Array.from({ length: 51 }, (_, i) => ({ id: String(i), nameEn: 'Backup officer', nameAr: 'موظف', departmentId: 'other', department: null, role: { nameEn: 'Officer' }, employeeTicketRatings: [],
      [relation]: [{ id: 'open', createdAt, status: 'IN_PROGRESS', dueAt: createdAt, slaEvents: [{ type: 'BREACH' }] }, { id: 'closed', createdAt, resolvedAt, status: 'CLOSED', slaEvents: [] }],
    }));
  } } };
  const result = await (kind === 'tickets' ? fetchTicketsOfficersPerformance : fetchComplaintsOfficersPerformance)(prisma, filter, createdAt, new Date('2026-10-31'));
  assert.equal(result.length, 51);
  assert.equal(result[0].activeWorkload, 1);
  assert.equal(result[0].resolved, 1); // Created in October, resolved in November: same creation cohort as detail table.
  assert.equal(result[0].overdue, 1);
  assert.equal(result[0].newAssignments, 2);
});
for (const role of [RoleCode.ADMIN, RoleCode.CR_OFFICER]) test(`department rows honor search/status/date and ${role} session scope`, async () => {
  const departmentId = role === RoleCode.ADMIN ? 'requested' : 'session';
  const branchId = role === RoleCode.ADMIN ? 'requested-branch' : 'session-branch';
  const filter = { ...dates, departmentId: 'requested', branchId: 'requested-branch', search: 'repair', status: 'IN_PROGRESS' };
  const records = departmentRecordFilters({ ...filter, branchId });
  const prisma: any = {
    department: { findMany: async (query: any) => {
      assert.deepEqual(query.where, { isActive: true, id: departmentId, branchId });
      return [{ id: departmentId, nameEn: 'Service', nameAr: 'الصيانة', code: 'SRV', branchId, branch: null, users: [] }];
    } },
    internalTicket: { findMany: async (query: any) => {
      if (query.select.requestedBy) { assert.deepEqual(query.where.AND[0], buildTicketWhere(records.tickets)); return []; }
      assert.deepEqual(query.where, { ...buildTicketWhere(records.tickets), targetDepartmentId: { in: [departmentId] } });
      return [{ targetDepartmentId: departmentId, status: 'IN_PROGRESS', createdAt, dueAt: createdAt, assignedEmployeeId: 'officer' }];
    } },
    complaint: { findMany: async (query: any) => {
      assert.deepEqual(query.where, { ...buildComplaintWhere(records.complaints), departmentId: { in: [departmentId] } });
      return [{ id: 'c', departmentId, status: 'IN_PROGRESS', createdAt: new Date(), slaEvents: [{ type: 'BREACH' }] }];
    } },
  };
  const result = await new ReportsDepartmentsRepository(prisma).getPerformance(filter, { role, branchId: 'session-branch', departmentId: 'session' });
  assert.equal(result[0].ticketsOpen, 1);
  assert.equal(result[0].complaintsOverdue, 1); // SLA event, not a fabricated age threshold.
  assert.equal(result[0].combinedVolume, 2);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStatusBoardFilters, STATUS_BOARD_PAGE_SIZE } from '../../src/components/reports/report-status-board';
import { reportRecordDetailHref, staffDetailBackHref } from '../../src/lib/staff-report-navigation';

test('status board filters stay independent and preserve server scope inputs', () => {
  const result = buildStatusBoardFilters({
    from: '', to: '2026-10-31', search: '  brakes  ', branchId: 'branch-1', departmentId: 'dept-2', status: 'IN_PROGRESS',
  });
  assert.deepEqual(result.tickets, {
    dateFrom: '1970-01-01', dateTo: '2026-10-31', search: 'brakes', branchId: 'branch-1',
    targetDepartmentId: 'dept-2', status: 'IN_PROGRESS',
  });
  assert.deepEqual(result.complaints, {
    dateFrom: '1970-01-01', dateTo: '2026-10-31', search: 'brakes', branchId: 'branch-1',
    departmentId: 'dept-2', status: 'IN_PROGRESS',
  });
});

test('status board requests a bounded first page', () => {
  assert.equal(STATUS_BOARD_PAGE_SIZE, 25);
  assert.ok(STATUS_BOARD_PAGE_SIZE <= 100);
});

test('status board date filters stay open ended on either side for both record types', () => {
  const fromOnly = buildStatusBoardFilters({ from: '2026-10-01', to: '', search: '', branchId: null, departmentId: null, status: 'NEW' });
  const toOnly = buildStatusBoardFilters({ from: '', to: '2026-10-31', search: '', branchId: null, departmentId: null, status: 'NEW' });
  assert.equal(fromOnly.complaints.dateTo, '9999-12-31');
  assert.equal(fromOnly.tickets.dateTo, '9999-12-31');
  assert.equal(toOnly.complaints.dateFrom, '1970-01-01');
  assert.equal(toOnly.tickets.dateFrom, '1970-01-01');
});

test('report record links return to reports without allowing arbitrary return paths', () => {
  assert.equal(reportRecordDetailHref('ticket', 'ticket/one', 'en'), '/internal-tickets/ticket%2Fone?returnTo=reports&locale=en');
  assert.equal(reportRecordDetailHref('complaint', 'cmp-1', 'ar'), '/complaints/cmp-1?returnTo=reports&locale=ar');
  assert.equal(reportRecordDetailHref('ticket', 'tk-2', 'en', 'ticket-reports'), '/internal-tickets/tk-2?returnTo=ticket-reports&locale=en');
  assert.equal(staffDetailBackHref('reports', 'en', 'tickets'), '/reports?locale=en');
  assert.equal(staffDetailBackHref('reports', 'ar', 'complaints'), '/reports?locale=ar');
  assert.equal(staffDetailBackHref('complaint-reports', 'en', 'complaints'), '/reports/complaints?locale=en');
  assert.equal(staffDetailBackHref('ticket-reports', 'ar', 'tickets'), '/reports/internal-tickets?locale=ar');
  assert.equal(staffDetailBackHref(undefined, 'en', 'tickets'), '/internal-tickets?locale=en');
  assert.equal(staffDetailBackHref('https://attacker.test', 'en', 'complaints'), '/complaints?locale=en');
});

test('specialized report date dimensions are mapped only to supported record APIs', () => {
  const result = buildStatusBoardFilters({
    from: '2026-10-01', to: '', search: '', branchId: null, departmentId: null, status: 'IN_PROGRESS', dateDimension: 'dueAt',
  });
  assert.equal(result.tickets.dateDimension, 'dueAt');
  assert.equal(result.complaints.dateDimension, 'createdAt');
});

test('specialized report filters stay attached to their matching record type', () => {
  const result = buildStatusBoardFilters({
    from: '', to: '', search: '', branchId: null, departmentId: 'target-1', status: 'ASSIGNED',
    extras: { creatingDepartmentId: 'source-1', assignedEmployeeId: 'employee-1', ownerId: 'owner-1', categoryId: 'category-1', priority: 'URGENT', severity: 'HIGH' },
  });
  assert.equal(result.tickets.targetDepartmentId, 'target-1');
  assert.equal(result.tickets.creatingDepartmentId, 'source-1');
  assert.equal(result.tickets.assignedEmployeeId, 'employee-1');
  assert.equal(result.tickets.categoryId, 'category-1');
  assert.equal(result.tickets.priority, 'URGENT');
  assert.equal(result.complaints.departmentId, 'target-1');
  assert.equal(result.complaints.ownerId, 'owner-1');
  assert.equal(result.complaints.categoryId, 'category-1');
  assert.equal(result.complaints.severity, 'HIGH');
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeWorkItems } from '../../src/lib/staff-tasks-aggregate';
import type { EmployeeTodayTasks } from '../../src/lib/staff-tasks-api';

test('internal officer work merge excludes other staff tickets in the same department', () => {
  const empty: EmployeeTodayTasks = { completed: [], dueToday: [], overdue: [], overduePromises: [], assignedToMe: [], waitingOnMe: [] };
  const now = new Date('2026-06-20T12:00:00.000Z');
  const tickets = [
    { id: 'mine', title: 'Mine', requestedById: 'manager', assignedEmployeeId: 'officer', targetDepartmentId: 'department-1', status: 'NEW', createdAt: now.toISOString() },
    { id: 'other', title: 'Other', requestedById: 'manager', assignedEmployeeId: 'coworker', targetDepartmentId: 'department-1', status: 'NEW', createdAt: now.toISOString() },
    { id: 'team', title: 'Team', requestedById: 'manager-2', assignedEmployeeId: null, targetDepartmentId: 'department-1', status: 'ASSIGNED', createdAt: now.toISOString() },
  ];
  const officer = mergeWorkItems(empty, tickets, [], now, 'officer', true);
  const manager = mergeWorkItems(empty, tickets, [], now, 'manager', false);
  assert.deepEqual(officer.assignedToMe.map((item) => item.id), ['ticket_mine', 'ticket_team']);
  assert.deepEqual(manager.assignedToMe.map((item) => item.id), ['ticket_mine', 'ticket_other', 'ticket_team']);
});

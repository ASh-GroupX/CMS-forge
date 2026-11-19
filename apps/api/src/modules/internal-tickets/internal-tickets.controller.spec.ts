import assert from 'node:assert/strict';
import test from 'node:test';
import { InternalTicketsController } from './internal-tickets.controller.js';
import { InternalTicketsRepository } from './internal-tickets.repository.js';
import { InternalTicketsService } from './internal-tickets.service.js';
import { AppException } from '../../core/http-kernel.js';

test('internal-tickets controller can be constructed', () => {
  assert.ok(new InternalTicketsController(new InternalTicketsService(new InternalTicketsRepository(null as any), null as any)));
});

test('internal officer cannot request department or coworker ticket lists', async () => {
  const controller = new InternalTicketsController({ getDepartmentTickets: async () => [], getEmployeeTickets: async () => [] } as any);
  const request = { principal: { roleCode: 'INTERNAL_OFFICER', departmentId: 'department-1', userId: 'officer-1' } } as any;
  await assert.rejects(controller.getDepartmentTickets('department-1', request), (error: any) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN');
  await assert.rejects(controller.getEmployeeTickets('officer-2', request), (error: any) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN');
  assert.deepEqual(await controller.getEmployeeTickets('officer-1', request), []);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { AssignmentsController } from './assignments.controller.js';
import type { AssignmentsService } from './assignments.service.js';

test('assignment options use only the authenticated server principal', async () => {
  let actor: unknown;
  const service = {
    options: async (input: unknown) => {
      actor = input;
      return { users: [], departments: [] };
    },
  } as unknown as AssignmentsService;
  const controller = new AssignmentsController(service);
  const result = await controller.options({
    principal: { userId: 'user_1', roleCode: 'CR_MANAGER', branchId: 'branch_1', departmentId: 'dept_1', permissions: [] },
  } as never);
  assert.deepEqual(result, { users: [], departments: [] });
  assert.deepEqual(actor, { userId: 'user_1', roleCode: 'CR_MANAGER', branchId: 'branch_1', departmentId: 'dept_1' });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { DealsController } from './deals.controller.js';
import { DealsRepository } from './deals.repository.js';
import { DealsService } from './deals.service.js';

test('deals controller can be constructed', () => {
  assert.ok(new DealsController(new DealsService(new DealsRepository({} as never))));
});

test('handoff board derives role and branch from the staff session', async () => {
  let capturedScope: unknown;
  const controller = new DealsController({
    handoffBoard: async (scope: unknown) => {
      capturedScope = scope;
      return { byStage: [], stuck: [], currentHolder: [] };
    },
  } as unknown as DealsService);

  await controller.handoffBoard(request());

  assert.deepEqual(capturedScope, { roleCode: 'BRANCH_MANAGER', branchId: 'branch_1' });
});

function request(): AuthenticatedRequest {
  return {
    headers: {},
    principal: {
      sessionId: 'session_1',
      userId: 'manager_1',
      email: 'manager@example.test',
      nameEn: 'Manager',
      nameAr: 'Manager',
      roleCode: 'BRANCH_MANAGER',
      branchId: 'branch_1',
    },
  };
}

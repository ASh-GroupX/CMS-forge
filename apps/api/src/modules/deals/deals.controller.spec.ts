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

test('write routes derive actor context from the staff session', async () => {
  const calls: unknown[] = [];
  const controller = new DealsController({
    createForActor: async (input: unknown, actor: unknown) => {
      calls.push(['create', input, actor]);
      return { id: 'deal_1' };
    },
    advanceForActor: async (id: string, input: unknown, actor: unknown) => {
      calls.push(['advance', id, input, actor]);
      return { deal: { id }, taskId: 'task_1' };
    },
    updateBlockerForActor: async (id: string, blocker: string | null, actor: unknown) => {
      calls.push(['blocker', id, blocker, actor]);
      return { id, blocker };
    },
  } as unknown as DealsService);

  await controller.create({ title: 'Deal', branchId: 'branch_spoof', currentHolderId: 'holder_1', stageDueAt: '2026-06-22T09:00:00.000Z' }, request());
  await controller.advance('deal_1', { toStage: 'POST_DELIVERY', currentHolderId: 'holder_2', stageDueAt: '2026-06-23T09:00:00.000Z' }, request());
  await controller.blocker('deal_1', { blocker: 'Missing docs' }, request());

  assert.equal((calls[0] as unknown[])[0], 'create');
  assert.deepEqual((calls[0] as unknown[])[2], request().principal);
  assert.deepEqual((calls[1] as unknown[]).slice(0, 3), ['advance', 'deal_1', { currentHolderId: 'holder_2', stageDueAt: '2026-06-23T09:00:00.000Z' }]);
  assert.deepEqual((calls[2] as unknown[]).slice(0, 3), ['blocker', 'deal_1', 'Missing docs']);
}
);

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

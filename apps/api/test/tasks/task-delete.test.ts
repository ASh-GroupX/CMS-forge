import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { RoleCode } from '@prisma/client';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { TasksController } from '../../src/modules/tasks/tasks.controller.ts';
import type { TasksService } from '../../src/modules/tasks/tasks.service.ts';

const adminPrincipal: StaffPrincipal = {
  sessionId: 'session_admin',
  userId: 'user_admin',
  email: 'admin@example.test',
  nameEn: 'Admin User',
  nameAr: 'المشرف',
  roleCode: RoleCode.ADMIN,
  branchId: null,
};

test('delete task route requires SessionAuthGuard and CsrfGuard', () => {
  const guards = (Reflect.getMetadata(GUARDS_METADATA, TasksController.prototype.delete) as (new () => unknown)[] | undefined) ?? [];
  assert.deepEqual(guards.map((guard) => guard.name), ['SessionAuthGuard', 'CsrfGuard']);
});

test('delete task endpoint calls deleteForActor with actor and audit context', async () => {
  let deletedId: string | undefined;
  let actorUserId: string | undefined;

  const controller = new TasksController({
    deleteForActor: async (id: string, actor: { userId: string }) => {
      deletedId = id;
      actorUserId = actor.userId;
      return { ok: true };
    },
  } as unknown as TasksService);

  const req: AuthenticatedRequest = {
    principal: adminPrincipal,
    headers: { 'x-correlation-id': 'corr-123' },
  };

  const response = await controller.delete('task_to_delete', req);
  assert.deepEqual(response, { ok: true });
  assert.equal(deletedId, 'task_to_delete');
  assert.equal(actorUserId, 'user_admin');
});

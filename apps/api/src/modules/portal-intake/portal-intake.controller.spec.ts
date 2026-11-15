import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExecutionContext } from '@nestjs/common';
import type { AuditService } from '../../core/audit.service.js';
import type { AuthenticatedRequest, StaffPrincipal } from '../../core/auth.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { PortalIntakeAccessGuard } from './portal-intake-access.guard.js';
import { PortalIntakeController } from './portal-intake.controller.js';
import 'reflect-metadata';
const GUARDS_METADATA = '__guards__';

test('settings and fields require session-backed QR access; mutations require CSRF', () => {
  assert.deepEqual(Reflect.getMetadata(GUARDS_METADATA, PortalIntakeController).map((guard: { name: string }) => guard.name), ['SessionAuthGuard', 'PortalIntakeAccessGuard']);
  assert.deepEqual(Reflect.getMetadata(GUARDS_METADATA, PortalIntakeController.prototype.save).map((guard: { name: string }) => guard.name), ['CsrfGuard']);
  assert.deepEqual(Reflect.getMetadata(GUARDS_METADATA, PortalIntakeController.prototype.saveFields).map((guard: { name: string }) => guard.name), ['CsrfGuard']);
});

const staff: StaffPrincipal = {
  sessionId: 'session-1', userId: 'staff-1', email: 'staff@example.test',
  nameEn: 'Staff', nameAr: 'موظف', roleCode: 'CR_OFFICER', branchId: 'branch-1',
  viewMode: 'CUSTOM', allowedNavKeys: ['admin', 'admin:portal-intake'],
};

function context(principal: StaffPrincipal, url = '/admin/portal-intake-settings'): ExecutionContext {
  const request: AuthenticatedRequest = { principal, headers: {}, url, method: 'PUT' };
  return { switchToHttp: () => ({ getRequest: () => request }) } as ExecutionContext;
}

test('explicit custom QR grant works for any role and denied calls are audited', async () => {
  const audits: Array<{ action: string; targetId?: string | null }> = [];
  const guard = new PortalIntakeAccessGuard({ record: async (record) => { audits.push(record); } } as AuditService);
  assert.equal(await guard.canActivate(context(staff)), true);
  assert.equal(await guard.canActivate(context({ ...staff, roleCode: 'BRANCH_MANAGER' }, '/admin/portal-intake-settings/fields')), true);
  assert.equal(await guard.canActivate(context({ ...staff, roleCode: 'ADMIN', viewMode: 'BOTH', allowedNavKeys: [] })), true);

  for (const denied of [
    { ...staff, allowedNavKeys: ['admin'] },
    { ...staff, allowedNavKeys: ['admin:portal-intake'] },
    { ...staff, viewMode: 'BOTH' },
    { ...staff, viewMode: 'CUSTOM', allowedNavKeys: [] },
  ]) {
    await assert.rejects(guard.canActivate(context(denied)),
      (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN');
  }
  assert.equal(audits.length, 4);
  assert.ok(audits.every((record) => record.action === 'rbac_forbidden' && record.targetId === '/admin/portal-intake-settings'));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { canAccessAdminSection, canManagePortalIntake, navForPrincipal } from '../../src/lib/staff-nav-rules';

test('QR settings are visible only to Admin or a custom explicit user grant', () => {
  const grant = ['admin', 'admin:portal-intake'];
  assert.equal(canManagePortalIntake('ADMIN', 'BOTH', []), true);
  assert.equal(canManagePortalIntake('CR_OFFICER', 'CUSTOM', grant), true);
  assert.equal(canManagePortalIntake('BRANCH_MANAGER', 'CUSTOM', grant), true);
  assert.equal(canManagePortalIntake('CR_OFFICER', 'BOTH', grant), false);
  assert.equal(canManagePortalIntake('CR_OFFICER', 'CUSTOM', ['admin']), false);
  assert.equal(canManagePortalIntake('CR_OFFICER', 'CUSTOM', ['admin:portal-intake']), false);
  assert.equal(canAccessAdminSection('admin:portal-intake', grant, [], 'CR_OFFICER', 'CUSTOM'), true);
  assert.equal(canAccessAdminSection('admin:portal-intake', grant, [], 'CR_OFFICER', 'BOTH'), false);
  assert.equal(canAccessAdminSection('admin:portal-intake', ['admin'], ['MASTER_DATA_MANAGE'], 'CR_OFFICER', 'CUSTOM'), false);
  assert.ok(navForPrincipal('CR_OFFICER', [], { viewMode: 'CUSTOM', allowedNavKeys: grant }).includes('admin'));
});

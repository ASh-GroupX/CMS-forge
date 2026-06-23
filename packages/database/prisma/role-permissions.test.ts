import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultRolePermissions, permissionDefinitions } from './role-permissions.js';

test('default role permissions only reference catalogued permissions', () => {
  const catalog = new Set(permissionDefinitions.map(([code]) => code));

  for (const permissions of Object.values(defaultRolePermissions)) {
    for (const permission of permissions) assert.ok(catalog.has(permission));
  }
});

test('admin template grants the complete permission catalog', () => {
  assert.deepEqual(new Set(defaultRolePermissions.ADMIN), new Set(permissionDefinitions.map(([code]) => code)));
});

test('customer portal template stays separate from staff permissions', () => {
  assert.deepEqual(defaultRolePermissions.CUSTOMER_PORTAL, ['PORTAL_SUBMIT']);
  assert.ok(!defaultRolePermissions.CR_OFFICER.includes('PORTAL_SUBMIT'));
});

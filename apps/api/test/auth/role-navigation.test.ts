import assert from 'node:assert/strict';
import test from 'node:test';
import { roleNavigationDefaults } from '../../src/modules/auth/role-navigation.ts';

test('custom role pages become server session navigation defaults', () => {
  assert.deepEqual(roleNavigationDefaults({
    roleCode: 'SERVICE_LEAD', viewMode: 'BOTH', allowedNavKeys: [],
    permissionCodes: ['STAFF_LOGIN', 'ROLE_VIEW_CUSTOM', 'ROLE_NAV_SERVICE_BOOKING', 'ROLE_NAV_ADMIN_BOOKING_SETTINGS'],
  }), { viewMode: 'CUSTOM', allowedNavKeys: ['serviceBooking', 'admin:booking-settings', 'admin'] });
  assert.deepEqual(roleNavigationDefaults({ roleCode: 'SERVICE_LEAD', permissionCodes: ['STAFF_LOGIN', 'ROLE_VIEW_CRM'] }),
    { viewMode: 'CRM', allowedNavKeys: [] });
});

test('built-in roles and explicit user rules keep their own navigation', () => {
  assert.deepEqual(roleNavigationDefaults({ roleCode: 'ADMIN', viewMode: 'BOTH', allowedNavKeys: [],
    permissionCodes: ['ROLE_VIEW_CUSTOM', 'ROLE_NAV_SERVICE_BOOKING'] }), { viewMode: 'BOTH', allowedNavKeys: [] });
  assert.deepEqual(roleNavigationDefaults({ roleCode: 'SERVICE_LEAD', viewMode: 'INTERNAL_TICKETS',
    allowedNavKeys: ['internalTickets'], permissionCodes: ['ROLE_VIEW_CUSTOM', 'ROLE_NAV_SERVICE_BOOKING'] }),
  { viewMode: 'INTERNAL_TICKETS', allowedNavKeys: ['internalTickets'] });
});

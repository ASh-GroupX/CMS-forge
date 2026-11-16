import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdminRoles } from '../../src/components/admin-roles';
import type { AdminPermission, AdminRolesData } from '../../src/lib/staff-admin-roles-api';

const permission = (code: string): AdminPermission => ({ id: code, code, nameEn: code, nameAr: code });
const permissions = ['STAFF_LOGIN', 'ROLE_VIEW_BOTH', 'ROLE_VIEW_CRM', 'ROLE_VIEW_CUSTOM', 'ROLE_NAV_SERVICE_BOOKING'];
const data: AdminRolesData = { permissions: permissions.map(permission), roles: [
  { ...permission('ADMIN'), isActive: true, isSystem: true, permissions: [permission('STAFF_LOGIN')], updatedAt: '2026-11-16', affectedActiveUserCount: 1 },
  { ...permission('SERVICE_LEAD'), isActive: true, isSystem: false, permissions: [permission('STAFF_LOGIN'), permission('ROLE_VIEW_CUSTOM'), permission('ROLE_NAV_SERVICE_BOOKING')], updatedAt: '2026-11-16', affectedActiveUserCount: 1 },
] };

test('new roles expose localized view and navigation controls while built-in role grants stay unchanged', () => {
  for (const locale of ['en', 'ar'] as const) {
    const html = renderToStaticMarkup(<AdminRoles createAction={() => undefined} data={data} locale={locale} updateAction={() => undefined} />);
    assert.match(html, new RegExp(locale === 'en' ? 'Role view' : 'عرض الدور'));
    assert.match(html, /type="radio"[^>]*value="ROLE_VIEW_BOTH"/);
    assert.match(html, /value="ROLE_NAV_SERVICE_BOOKING"/);
    assert.equal(data.roles[0]!.permissions.some((item) => item.code.startsWith('ROLE_')), false);
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ApiKeysWorkspace } from '../../src/components/admin-api-keys';
import { canAccessAdminSection } from '../../src/lib/staff-nav-rules';

const existing = {
  id: 'key-1', name: 'Reports', keyPrefix: 'cms_live_abc',
  scopes: ['customers:read' as const], branchIds: ['branch-1'], allBranches: false,
  createdAt: '2026-11-10T09:00:00.000Z', lastUsedAt: null, revokedAt: null,
};

test('admin API key workspace shows stored metadata and create controls without a stored secret', () => {
  const html = renderToStaticMarkup(<ApiKeysWorkspace initial={{ status: 'ok', keys: [existing], branches: [{ id: 'branch-1', nameEn: 'Main', nameAr: 'الرئيسي' }] }} locale="en" />);
  assert.match(html, /External Data API/);
  assert.match(html, /Create an API key/);
  assert.match(html, /Internal tickets/);
  assert.match(html, /Reports/);
  assert.match(html, /cms_live_abc/);
  assert.match(html, /Stop access/);
  assert.doesNotMatch(html, /Bearer cms_live_abc/);
  assert.doesNotMatch(html, /Copy key/);
});

test('admin API key workspace renders Arabic direction and actionable error state', () => {
  const html = renderToStaticMarkup(<ApiKeysWorkspace initial={{ status: 'error' }} locale="ar" />);
  assert.match(html, /dir="rtl"/);
  assert.match(html, /تعذر تحميل مفاتيح API/);
  assert.match(html, /تحديث/);
  const ready = renderToStaticMarkup(<ApiKeysWorkspace initial={{ status: 'ok', keys: [], branches: [] }} locale="ar" />);
  assert.match(ready, /التذاكر الداخلية/);
});

test('admin navigation permission includes integration management', () => {
  assert.equal(canAccessAdminSection('admin:api-keys', [], ['INTEGRATIONS_MANAGE'], 'ADMIN'), true);
  assert.equal(canAccessAdminSection('admin:api-keys', [], ['REPORT_VIEW'], 'ADMIN'), false);
});

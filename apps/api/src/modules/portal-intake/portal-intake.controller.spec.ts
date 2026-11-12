import assert from 'node:assert/strict';
import test from 'node:test';
import { PortalIntakeController } from './portal-intake.controller.js';
import 'reflect-metadata';
const GUARDS_METADATA = '__guards__';

test('settings reads and writes require Admin server-session guards, mutations require CSRF', () => {
  assert.deepEqual(Reflect.getMetadata('cms:auto:roles', PortalIntakeController), ['ADMIN']);
  assert.deepEqual(Reflect.getMetadata(GUARDS_METADATA, PortalIntakeController).map((guard: { name: string }) => guard.name), ['SessionAuthGuard', 'RbacGuard']);
  assert.deepEqual(Reflect.getMetadata(GUARDS_METADATA, PortalIntakeController.prototype.save).map((guard: { name: string }) => guard.name), ['CsrfGuard']);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { PortalController } from './portal.controller.js';
import { PortalService } from './portal.service.js';

test('portal controller can be constructed', () => {
  assert.ok(new PortalController(new PortalService({} as never, {} as never, {} as never, {} as never)));
});

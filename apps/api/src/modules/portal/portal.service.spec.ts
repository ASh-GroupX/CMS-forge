import assert from 'node:assert/strict';
import test from 'node:test';
import { PortalService } from './portal.service.js';

test('portal service can be constructed', () => {
  assert.ok(new PortalService({} as never));
});

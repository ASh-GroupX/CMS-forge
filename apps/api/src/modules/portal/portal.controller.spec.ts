import assert from 'node:assert/strict';
import test from 'node:test';
import type { ComplaintFormOptionsService } from '../complaints/complaint-form-options.service.js';
import { PortalController } from './portal.controller.js';
import { PortalService } from './portal.service.js';

test('portal controller can be constructed', () => {
  assert.ok(new PortalController(
    new PortalService({} as never, {} as never, {} as never, {} as never),
    { listPublic: async () => ({ branches: [], categories: [], severities: [] }) } as unknown as ComplaintFormOptionsService,
  ));
});

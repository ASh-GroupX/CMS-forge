import assert from 'node:assert/strict';
import test from 'node:test';
import { IntegrationsController } from './integrations.controller.js';
import { IntegrationsService } from './integrations.service.js';

test('integrations controller can be constructed', () => {
  assert.ok(
    new IntegrationsController(
      new IntegrationsService({} as never, {} as never, {} as never, {} as never),
    ),
  );
});

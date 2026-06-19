import assert from 'node:assert/strict';
import test from 'node:test';
import { IntegrationsRepository } from './integrations.repository.js';
import { IntegrationsService } from './integrations.service.js';

test('integrations service can be constructed', () => {
  assert.ok(new IntegrationsService(new IntegrationsRepository()));
});

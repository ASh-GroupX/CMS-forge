import assert from 'node:assert/strict';
import test from 'node:test';
import { checkScaffold, requiredScripts } from './scaffold-check.mjs';

test('scaffold exposes the required proof script names', () => {
  const result = checkScaffold();
  assert.deepEqual(result.missingScripts, []);
  assert.ok(requiredScripts.includes('openapi:check'));
});

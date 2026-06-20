import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { checkScaffold, requiredScripts } from './scaffold-check.mjs';

test('scaffold exposes the required proof script names', () => {
  const result = checkScaffold();
  assert.deepEqual(result.missingScripts, []);
  assert.ok(requiredScripts.includes('openapi:check'));
});

test('performance proof script is wired to the real web performance runner', () => {
  const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts;

  assert.equal(scripts['test:performance'], 'node --import tsx tools/web-proof.mjs perf');
  assert.doesNotMatch(scripts['test:performance'], /pending-proof/);
});

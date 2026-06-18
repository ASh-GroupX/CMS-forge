import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('pending proof commands fail loudly', () => {
  const result = spawnSync(process.execPath, ['tools/pending-proof.mjs', 'test:visual'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /test:visual is declared/);
});

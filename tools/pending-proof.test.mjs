import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('unimplemented proof commands still fail loudly', () => {
  const result = spawnSync(process.execPath, ['tools/pending-proof.mjs', 'db:index:check'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /db:index:check is declared/);
});

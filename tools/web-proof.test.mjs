import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const nodeWithTsx = ['--import', 'tsx', 'tools/web-proof.mjs'];

test('web proof runner passes visual, accessibility, and performance smoke modes', () => {
  for (const mode of ['visual', 'accessibility', 'perf']) {
    const result = spawnSync(process.execPath, [...nodeWithTsx, mode], { encoding: 'utf8' });

    assert.equal(result.status, 0, `${mode} failed: ${result.stderr}`);
    assert.match(result.stdout, new RegExp(`web ${mode} proof passed`));
  }
});

test('web proof runner rejects unknown suites loudly', () => {
  const result = spawnSync(process.execPath, [...nodeWithTsx, 'unknown'], { encoding: 'utf8' });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Use one of: visual, accessibility, perf, ui-smoke\./);
});

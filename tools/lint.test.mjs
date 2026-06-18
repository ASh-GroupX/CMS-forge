import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { checkForbiddenImports } from './lint.mjs';

test('lint rejects frontend imports from api package', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-lint-'));
  mkdirSync(join(root, 'apps/web/src'), { recursive: true });
  writeFileSync(join(root, 'apps/web/src/index.ts'), "import '@cms-auto/api';\n");

  assert.deepEqual(checkForbiddenImports(root), [
    'apps/web/src/index.ts: web must not import @cms-auto/api',
  ]);
});

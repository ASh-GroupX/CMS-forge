import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { checkForbiddenImports, checkForbiddenMarkers } from './lint.mjs';

test('lint rejects frontend imports from api package', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-lint-'));
  mkdirSync(join(root, 'apps/web/src'), { recursive: true });
  writeFileSync(join(root, 'apps/web/src/index.ts'), "import '@cms-auto/api';\n");

  assert.deepEqual(checkForbiddenImports(root), [
    'apps/web/src/index.ts: web must not import @cms-auto/api',
  ]);
});

test('lint rejects frontend imports from database and provider packages', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-lint-'));
  mkdirSync(join(root, 'apps/web/src'), { recursive: true });
  writeFileSync(join(root, 'apps/web/src/index.ts'), "import '@prisma/client';\nimport '@aws-sdk/client-s3';\n");

  assert.deepEqual(checkForbiddenImports(root), [
    'apps/web/src/index.ts: web must not import @prisma/client',
    'apps/web/src/index.ts: web must not import @aws-sdk/client-s3',
  ]);
});

test('lint rejects cross-module repository and dto imports', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-lint-'));
  mkdirSync(join(root, 'apps/api/src/modules/complaints'), { recursive: true });
  writeFileSync(
    join(root, 'apps/api/src/modules/complaints/complaints.service.ts'),
    "import '../branches/branches.repository';\nimport '../branches/dto/create-branch.dto';\n",
  );

  assert.deepEqual(checkForbiddenImports(root), [
    'apps/api/src/modules/complaints/complaints.service.ts: module must not import another module private API (../branches/branches.repository)',
    'apps/api/src/modules/complaints/complaints.service.ts: module must not import another module private API (../branches/dto/create-branch.dto)',
  ]);
});

test('lint rejects TODO and FIXME markers in app and package sources', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-lint-'));
  mkdirSync(join(root, 'packages/contracts/src'), { recursive: true });
  writeFileSync(join(root, 'packages/contracts/src/index.ts'), '// TODO remove later\n');

  assert.deepEqual(checkForbiddenMarkers(root), [
    'packages/contracts/src/index.ts: TODO/FIXME markers are not allowed',
  ]);
});

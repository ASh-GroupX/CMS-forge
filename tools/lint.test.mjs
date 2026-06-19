import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  checkAgenticFileSize,
  checkForbiddenImports,
  checkForbiddenMarkers,
  checkModuleManifests,
} from './lint.mjs';

const manifestBody = [
  '---',
  'type: forge.module',
  'title: Auth Module',
  'description: Agent context boundary for the auth module.',
  'tags: [backend, module, agent-context]',
  '---',
  '# Auth Module',
  '- Public surface: `AuthService`',
  '- Owns tables: users, sessions',
  '- May depend on: core/*',
  '- SRS: ARCH-AUTH-001',
  '',
].join('\n');

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

test('lint rejects oversized source files', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-lint-'));
  mkdirSync(join(root, 'apps/api/src/modules/auth'), { recursive: true });
  writeFileSync(
    join(root, 'apps/api/src/modules/auth/auth.service.ts'),
    `${Array.from({ length: 301 }, (_, index) => `export const line${index} = ${index};`).join('\n')}\n`,
  );

  assert.deepEqual(checkAgenticFileSize(root), [
    'apps/api/src/modules/auth/auth.service.ts: 301 lines exceeds agentic file budget (300)',
  ]);
});

test('lint exempts test and dto files from the size budget', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-lint-'));
  mkdirSync(join(root, 'apps/api/src/modules/auth/dto'), { recursive: true });
  const longBody = `${Array.from({ length: 320 }, (_, index) => `export const line${index} = ${index};`).join('\n')}\n`;
  writeFileSync(join(root, 'apps/api/src/modules/auth/auth.service.spec.ts'), longBody);
  writeFileSync(join(root, 'apps/api/src/modules/auth/dto/create-auth.dto.ts'), longBody);

  assert.deepEqual(checkAgenticFileSize(root), []);
});

test('lint requires a complete MODULE.md manifest in each module', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-lint-'));
  mkdirSync(join(root, 'apps/api/src/modules/auth'), { recursive: true });
  writeFileSync(join(root, 'apps/api/src/modules/auth/auth.service.ts'), 'export class AuthService {}\n');

  assert.deepEqual(checkModuleManifests(root), [
    'apps/api/src/modules/auth: missing MODULE.md agent context manifest',
  ]);

  writeFileSync(join(root, 'apps/api/src/modules/auth/MODULE.md'), '# Auth Module\n- Public surface: `AuthService`\n- Owns tables: users\n- May depend on: core/*\n- SRS: ARCH-AUTH-001\n');
  assert.deepEqual(checkModuleManifests(root), [
    'apps/api/src/modules/auth/MODULE.md: missing OKF-style YAML frontmatter',
  ]);

  writeFileSync(join(root, 'apps/api/src/modules/auth/MODULE.md'), manifestBody);
  assert.deepEqual(checkModuleManifests(root), []);
});

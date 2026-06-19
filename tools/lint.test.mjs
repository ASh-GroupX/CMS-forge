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
import { checkManifestTruth } from './manifest-truth-check.mjs';
import { checkModuleWiring } from './wiring-check.mjs';

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

function writeWiringFixture(root) {
  mkdirSync(join(root, 'apps/api/src/modules/auth'), { recursive: true });
  mkdirSync(join(root, 'apps/api/src/modules/sla'), { recursive: true });
  writeFileSync(join(root, 'apps/api/src/modules/auth/auth.module.ts'), '@Module({})\nexport class AuthModule {}\n');
  writeFileSync(join(root, 'apps/api/src/modules/sla/sla.module.ts'), '@Module({ imports: [] })\nexport class SlaModule {}\n');
}

test('module wiring gate flags a module missing from the AppModule graph', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-lint-'));
  writeWiringFixture(root);
  writeFileSync(join(root, 'apps/api/src/main.ts'), '@Module({ imports: [AuthModule] })\nclass AppModule {}\n');

  assert.deepEqual(checkModuleWiring(root, new Set()), [
    'apps/api/src/modules/sla: SlaModule is not wired into the AppModule graph (orphaned module, dead at runtime)',
  ]);
});

test('module wiring gate passes when a module is reachable transitively', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-lint-'));
  writeWiringFixture(root);
  mkdirSync(join(root, 'apps/api/src/modules/portal'), { recursive: true });
  writeFileSync(
    join(root, 'apps/api/src/modules/portal/portal.module.ts'),
    '@Module({ imports: [SlaModule] })\nexport class PortalModule {}\n',
  );
  writeFileSync(join(root, 'apps/api/src/main.ts'), '@Module({ imports: [AuthModule, PortalModule] })\nclass AppModule {}\n');

  assert.deepEqual(checkModuleWiring(root, new Set()), []);
});

test('module wiring gate grandfathers known debt but flags it once wired', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-lint-'));
  writeWiringFixture(root);
  writeFileSync(join(root, 'apps/api/src/main.ts'), '@Module({ imports: [AuthModule] })\nclass AppModule {}\n');
  assert.deepEqual(checkModuleWiring(root, new Set(['sla'])), []);

  writeFileSync(join(root, 'apps/api/src/main.ts'), '@Module({ imports: [AuthModule, SlaModule] })\nclass AppModule {}\n');
  assert.deepEqual(checkModuleWiring(root, new Set(['sla'])), [
    'tools/wiring-check.mjs knownUnwiredModules: "sla" is wired now - remove it from the allowlist',
  ]);
});

test('module wiring gate reports a missing AppModule composition root', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-lint-'));
  mkdirSync(join(root, 'apps/api/src'), { recursive: true });
  writeFileSync(join(root, 'apps/api/src/main.ts'), 'export const boundary = 1;\n');

  assert.deepEqual(checkModuleWiring(root, new Set()), [
    'apps/api/src/main.ts: no AppModule found to verify module wiring',
  ]);
});

test('module wiring gate holds on the real repository with sla grandfathered', () => {
  assert.deepEqual(checkModuleWiring(), []);
});

function writeManifestTruthFixture(root, manifestMayDepend = '', ownedTables = '- `users`') {
  mkdirSync(join(root, 'apps/api/src/modules/auth'), { recursive: true });
  mkdirSync(join(root, 'apps/api/src/modules/complaints'), { recursive: true });
  mkdirSync(join(root, 'packages/database/prisma'), { recursive: true });
  writeFileSync(join(root, 'packages/database/prisma/schema.prisma'), 'model User {\n  id String @id\n  @@map("users")\n}\n');
  writeFileSync(join(root, 'apps/api/src/modules/auth/MODULE.md'), [
    '---', 'type: forge.module', 'title: Auth Module', 'description: Auth.', 'tags: [backend]', '---',
    '# Auth Module', '## Public surface', '- `AuthService`', '## Owns tables', ownedTables,
    '## May depend on', manifestMayDepend || '- `core/http-kernel`', '## SRS', '- ARCH-AUTH-001', '',
  ].join('\n'));
  writeFileSync(join(root, 'apps/api/src/modules/complaints/MODULE.md'), manifestBody);
}

test('manifest truth gate flags undeclared cross-module imports', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-lint-'));
  writeManifestTruthFixture(root);
  writeFileSync(join(root, 'apps/api/src/modules/auth/auth.service.ts'), "import { ComplaintsService } from '../complaints/complaints.service.js';\n");

  assert.deepEqual(checkManifestTruth(root), [
    'apps/api/src/modules/auth/MODULE.md: May depend on must declare modules/complaints used by imports',
  ]);
});

test('manifest truth gate accepts declared cross-module imports', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-lint-'));
  writeManifestTruthFixture(root, '- `ComplaintsService` through `ComplaintsModule`');
  writeFileSync(join(root, 'apps/api/src/modules/auth/auth.service.ts'), "import { ComplaintsService } from '../complaints/complaints.service.js';\n");

  assert.deepEqual(checkManifestTruth(root), []);
});

test('manifest truth gate flags undeclared Prisma table usage', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-lint-'));
  writeManifestTruthFixture(root, '', '- `branches`');
  writeFileSync(join(root, 'apps/api/src/modules/auth/auth.repository.ts'), 'export class AuthRepository { constructor(private prisma) {} read() { return this.prisma.user.findMany(); } }\n');

  assert.deepEqual(checkManifestTruth(root), [
    'apps/api/src/modules/auth/MODULE.md: Owns tables must declare Prisma table "users" used by repository',
  ]);
});

test('manifest truth gate holds on the real repository', () => {
  assert.deepEqual(checkManifestTruth(), []);
});
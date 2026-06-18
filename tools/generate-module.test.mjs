import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { checkModuleManifests } from './lint.mjs';
import { generateModule, moduleFiles, parseArgs } from './generate-module.mjs';

test('generator creates the canonical module skeleton', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-generator-'));
  const files = generateModule('branches', root);

  assert.deepEqual(files, [
    'apps/api/src/modules/branches/MODULE.md',
    'apps/api/src/modules/branches/branches.module.ts',
    'apps/api/src/modules/branches/branches.controller.ts',
    'apps/api/src/modules/branches/branches.service.ts',
    'apps/api/src/modules/branches/branches.repository.ts',
    'apps/api/src/modules/branches/dto/create-branch.dto.ts',
    'apps/api/src/modules/branches/dto/update-branch.dto.ts',
    'apps/api/src/modules/branches/dto/branch-response.dto.ts',
    'apps/api/src/modules/branches/branches.service.spec.ts',
    'apps/api/src/modules/branches/branches.controller.spec.ts',
  ]);

  for (const file of files) {
    assert.equal(existsSync(join(root, file)), true);
  }

  assert.deepEqual(checkModuleManifests(root), []);

  const moduleText = readFileSync(join(root, 'apps/api/src/modules/branches/branches.module.ts'), 'utf8');
  const controllerText = readFileSync(join(root, 'apps/api/src/modules/branches/branches.controller.ts'), 'utf8');
  const serviceText = readFileSync(join(root, 'apps/api/src/modules/branches/branches.service.ts'), 'utf8');
  const repositoryText = readFileSync(join(root, 'apps/api/src/modules/branches/branches.repository.ts'), 'utf8');
  const manifestText = readFileSync(join(root, 'apps/api/src/modules/branches/MODULE.md'), 'utf8');

  assert.match(moduleText, /@Module/);
  assert.match(moduleText, /exports: \[BranchesService\]/);
  assert.match(controllerText, /@Controller\('branches'\)/);
  assert.match(serviceText, /@Injectable/);
  assert.match(repositoryText, /@Injectable/);
  assert.match(manifestText, /Owns tables: `branches`/);
});

test('generator refuses invalid names', () => {
  assert.throws(() => moduleFiles('BadName'), /kebab-case lowercase/);
});

test('generator refuses to overwrite existing modules', () => {
  const root = mkdtempSync(join(tmpdir(), 'cms-auto-generator-'));
  mkdirSync(join(root, 'apps/api/src/modules/branches'), { recursive: true });

  assert.throws(() => generateModule('branches', root), /Module already exists/);
});

test('generator parses module name without an explicit root', () => {
  assert.equal(parseArgs(['branches']).moduleName, 'branches');
});

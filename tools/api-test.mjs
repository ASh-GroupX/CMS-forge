import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const suite = process.argv.slice(2).find((arg) => arg !== '--');
const allowedSuites = new Set(['auth', 'audit', 'admin', 'security', 'workflow']);

if (!suite || !allowedSuites.has(suite)) {
  console.error(`Unknown API test suite: ${suite ?? '(missing)'}`);
  process.exit(1);
}

const suiteDir = join('apps', 'api', 'test', suite);
const files = existsSync(suiteDir)
  ? readdirSync(suiteDir)
      .filter((file) => file.endsWith('.test.ts'))
      .map((file) => join(suiteDir, file))
  : [];

if (files.length === 0) {
  console.error(`No API tests found for suite: ${suite}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...files], {
  env: { ...process.env, TSX_TSCONFIG_PATH: 'apps/api/tsconfig.json' },
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (suite === 'audit') {
  const proof = spawnSync(process.execPath, ['tools/audit-append-only-proof.mjs'], {
    stdio: 'inherit',
  });
  process.exit(proof.status ?? 1);
}

process.exit(0);

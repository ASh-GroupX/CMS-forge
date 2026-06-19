import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const suite = process.argv.slice(2).find((arg) => arg !== '--') ?? 'shell';
const allowedSuites = new Set(['shell', 'api-client']);

if (!allowedSuites.has(suite)) {
  console.error(`Unknown web test suite: ${suite}`);
  process.exit(1);
}

const suiteDir = join('apps', 'web', 'test', suite);
const files = existsSync(suiteDir)
  ? readdirSync(suiteDir)
      .filter((file) => file.endsWith('.test.ts') || file.endsWith('.test.tsx'))
      .map((file) => join(suiteDir, file))
  : [];

if (files.length === 0) {
  console.error(`No web tests found for suite: ${suite}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...files], {
  env: { ...process.env, TSX_TSCONFIG_PATH: 'apps/web/tsconfig.json' },
  stdio: 'inherit',
});

process.exit(result.status ?? 1);

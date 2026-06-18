import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const suite = process.argv.slice(2).find((arg) => arg !== '--');
const allowedSuites = new Set(['auth']);

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
  stdio: 'inherit',
});

process.exit(result.status ?? 1);

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const requiredScripts = [
  'build',
  'lint',
  'typecheck',
  'test',
  'test:api',
  'test:e2e',
  'test:web',
  'test:visual',
  'web:perf',
  'test:performance',
  'openapi:generate',
  'openapi:check',
  'db:migrate:test',
  'db:index:check',
  'security:check',
  'ops:backup:check',
];

const requiredFiles = [
  'package.json',
  'pnpm-workspace.yaml',
  '.nvmrc',
  '.gitignore',
  '.prettierrc',
  'tsconfig.base.json',
  'docker-compose.yml',
  'apps/api/package.json',
  'apps/api/tsconfig.json',
  'apps/api/src/index.ts',
  'apps/web/package.json',
  'apps/web/tsconfig.json',
  'apps/web/src/index.ts',
  'packages/database/package.json',
  'packages/database/tsconfig.json',
  'packages/database/prisma/schema.prisma',
  'packages/database/src/index.ts',
  'packages/contracts/package.json',
  'packages/contracts/tsconfig.json',
  'packages/contracts/openapi.json',
  'packages/contracts/src/index.ts',
  'packages/config/package.json',
  'packages/config/tsconfig.json',
  'packages/config/src/index.ts',
  'tools/scaffold-check.mjs',
  'tools/openapi-check.mjs',
  'tools/pending-proof.mjs',
];

function readJson(root, file) {
  return JSON.parse(readFileSync(join(root, file), 'utf8'));
}

export function checkScaffold(root = process.cwd()) {
  const missingFiles = requiredFiles.filter((file) => !existsSync(join(root, file)));
  const packageJson = readJson(root, 'package.json');
  const missingScripts = requiredScripts.filter((script) => !packageJson.scripts?.[script]);
  const workspace = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8');
  const compose = readFileSync(join(root, 'docker-compose.yml'), 'utf8');
  const prisma = readFileSync(join(root, 'packages/database/prisma/schema.prisma'), 'utf8');

  const errors = [
    ...missingFiles.map((file) => `missing file: ${file}`),
    ...missingScripts.map((script) => `missing script: ${script}`),
  ];

  if (packageJson.packageManager !== 'pnpm@9.15.4') {
    errors.push('packageManager must be pnpm@9.15.4');
  }

  for (const pattern of ['apps/*', 'packages/*']) {
    if (!workspace.includes(pattern)) {
      errors.push(`workspace missing ${pattern}`);
    }
  }

  for (const service of ['postgres:', 'redis:']) {
    if (!compose.includes(service)) {
      errors.push(`docker-compose missing ${service}`);
    }
  }

  if (/^model\s+/m.test(prisma)) {
    errors.push('database scaffold must not define domain tables in F0-01');
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return { missingFiles, missingScripts };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkScaffold();
  console.log('Scaffold check passed');
}

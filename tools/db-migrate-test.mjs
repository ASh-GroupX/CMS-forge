import { spawnSync } from 'node:child_process';

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://cms:cms@localhost:5432/cms_auto',
};

const validate = spawnSync(
  'corepack',
  ['pnpm', '--dir', 'packages/database', 'exec', 'prisma', 'validate', '--schema', 'prisma/schema.prisma'],
  { env, shell: process.platform === 'win32', stdio: 'inherit' },
);
if (validate.status !== 0) process.exit(validate.status ?? 1);

const diff = spawnSync(
  'corepack',
  ['pnpm', '--dir', 'packages/database', 'exec', 'prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'],
  { env, encoding: 'utf8', shell: process.platform === 'win32' },
);
if (diff.status !== 0) {
  process.stderr.write(diff.stderr);
  process.exit(diff.status ?? 1);
}
if (!diff.stdout.includes('CREATE TABLE "complaints"')) {
  console.error('Migration SQL did not include core complaint table.');
  process.exit(1);
}
console.log('Migration SQL sanity check passed');

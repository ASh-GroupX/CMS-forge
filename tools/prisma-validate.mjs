import { spawnSync } from 'node:child_process';

const result = spawnSync(
  'corepack',
  ['pnpm', '--dir', 'packages/database', 'exec', 'prisma', 'validate', '--schema', 'prisma/schema.prisma'],
  {
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://cms:cms@localhost:5432/cms_auto',
    },
    shell: process.platform === 'win32',
    stdio: 'inherit',
  },
);

process.exit(result.status ?? 1);

import { PrismaClient, RoleCode } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = requireEnv('CMS_BOOTSTRAP_EMAIL').trim().toLowerCase();
  const password = requireEnv('CMS_BOOTSTRAP_PASSWORD');
  const roleCode = roleFromEnv(process.env.CMS_BOOTSTRAP_ROLE);
  const branchCode = process.env.CMS_BOOTSTRAP_BRANCH_CODE?.trim() || null;

  if (!email.includes('@')) fail('CMS_BOOTSTRAP_EMAIL must be an email address.');
  if (password.length < 12) fail('CMS_BOOTSTRAP_PASSWORD must be at least 12 characters.');

  const [role, branch] = await Promise.all([
    prisma.role.findUnique({ where: { code: roleCode } }),
    branchCode ? prisma.branch.findUnique({ where: { code: branchCode } }) : Promise.resolve(null),
  ]);
  if (!role) fail(`Role ${roleCode} is missing. Run corepack pnpm db:seed first.`);
  if (branchCode && !branch) fail(`Branch ${branchCode} is missing. Run corepack pnpm db:seed first.`);

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const nameEn = process.env.CMS_BOOTSTRAP_NAME_EN?.trim() || 'Local Staff Admin';
  const nameAr = process.env.CMS_BOOTSTRAP_NAME_AR?.trim() || nameEn;

  await prisma.user.upsert({
    where: { email },
    update: {
      branchId: branch?.id ?? null,
      isActive: true,
      lockedAt: null,
      nameAr,
      nameEn,
      passwordHash,
      roleId: role.id,
    },
    create: {
      branchId: branch?.id ?? null,
      email,
      nameAr,
      nameEn,
      passwordHash,
      roleId: role.id,
    },
  });

  console.log(`Staff account ready: ${email} (${roleCode}${branchCode ? `, branch ${branchCode}` : ''})`);
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) fail(`${name} is required.`);
  return value;
}

function roleFromEnv(value: string | undefined): RoleCode {
  const role = value?.trim() || RoleCode.ADMIN;
  if (Object.values(RoleCode).includes(role as RoleCode)) return role as RoleCode;
  fail(`CMS_BOOTSTRAP_ROLE must be one of: ${Object.values(RoleCode).join(', ')}.`);
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Staff bootstrap failed.');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

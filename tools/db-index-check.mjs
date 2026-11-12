import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const required = ['portal_intake_members_active_user_key', 'portal_intake_members_setting_id_removed_at_idx', 'portal_intake_members_user_id_removed_at_idx', 'assignments_entity_type_released_at_idx'];
const sql = readFileSync('packages/database/prisma/migrations/20261111120000_portal_intake_settings/migration.sql', 'utf8') + readFileSync('packages/database/prisma/migrations/20261112070000_assignment_release/migration.sql', 'utf8');
for (const name of required) assert.ok(sql.includes(`"${name}"`), `Missing migration index ${name}`);
const url = process.env.INTAKE_PROOF_DATABASE_URL;
if (!url || new URL(url).hostname !== '127.0.0.1' || !new URL(url).pathname.endsWith('/cms_intake_proof')) throw Error('Set INTAKE_PROOF_DATABASE_URL to isolated loopback cms_intake_proof for actual index verification');
const { PrismaClient } = createRequire(new URL('../apps/api/package.json', import.meta.url))('@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: url });
try {
  const rows = await prisma.$queryRaw`SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public'`;
  for (const name of required) assert.ok(rows.some((row) => row.indexname === name), `Missing PostgreSQL index ${name}`);
  const active = rows.find((row) => row.indexname === required[0]); assert.match(active.indexdef, /UNIQUE/); assert.match(active.indexdef, /removed_at IS NULL/);
  console.log('Passed migration and PostgreSQL intake indexes, including active membership uniqueness and released assignment filtering.');
} finally { await prisma.$disconnect(); }

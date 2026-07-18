import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync('packages/database/prisma/schema.prisma', 'utf8');
const migration = readFileSync(
  'packages/database/prisma/migrations/20260718120000_universal_assignments/migration.sql',
  'utf8',
);

test('universal assignment schema has one current row and append-only history', () => {
  assert.match(schema, /model Assignment \{/);
  assert.match(schema, /@@unique\(\[entityType, entityId\]\)/);
  assert.match(schema, /model AssignmentHistory \{/);
  assert.match(schema, /history\s+AssignmentHistory\[\]/);
  assert.match(schema, /assignedUserId\s+String\?/);
  assert.match(schema, /assignedDepartmentId\s+String\?/);
});
test('migration enforces a user or department target and keeps legacy columns', () => {
  assert.match(migration, /CONSTRAINT "assignments_target_required" CHECK/);
  assert.match(migration, /"assigned_user_id" IS NOT NULL OR "assigned_department_id" IS NOT NULL/);
  assert.doesNotMatch(migration, /DROP COLUMN/);
  assert.match(migration, /ALTER TABLE "tasks" ALTER COLUMN "assignee_id" DROP NOT NULL/);
  assert.match(migration, /ALTER TABLE "deals" ALTER COLUMN "current_holder_id" DROP NOT NULL/);
});

test('migration backfills every currently assignable aggregate idempotently', () => {
  for (const entityType of ['TASK', 'COMPLAINT', 'DEAL', 'CASE']) {
    assert.match(migration, new RegExp(`'${entityType}'`));
  }
  assert.equal((migration.match(/ON CONFLICT \("entity_type", "entity_id"\) DO NOTHING/g) ?? []).length, 4);
  assert.match(migration, /'BACKFILLED'/);
  assert.match(migration, /WHERE NOT EXISTS/);
});

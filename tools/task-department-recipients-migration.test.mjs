import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  'packages/database/prisma/migrations/20260725180000_task_department_recipients/migration.sql',
  'utf8',
);

test('task department recipient migration preserves and backfills existing task assignments', () => {
  assert.match(migration, /CREATE TABLE "task_department_recipients"/);
  assert.match(migration, /UNIQUE INDEX "task_department_recipients_task_id_department_id_key"/);
  assert.match(migration, /SELECT 'tdr_' \|\| md5\("id" \|\| ':' \|\| "assigned_department_id"\)/);
  assert.match(migration, /WHERE "assigned_department_id" IS NOT NULL/);
  assert.match(migration, /ON CONFLICT \("task_id", "department_id"\) DO NOTHING/);
  assert.doesNotMatch(migration, /\b(UPDATE|DELETE|TRUNCATE)\s+"?(tasks|departments|users)"?\b/i);
});

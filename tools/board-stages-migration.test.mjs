import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync('packages/database/prisma/schema.prisma', 'utf8');
const migration = readFileSync(
  'packages/database/prisma/migrations/20260722120000_board_stages/migration.sql',
  'utf8',
);

test('board-stage Prisma fields have a deployable migration', () => {
  assert.match(schema, /model BoardStage \{/);
  assert.match(schema, /stageId\s+String\?/);
  assert.match(schema, /boardPosition\s+Int\s+@default\(0\)/);

  assert.match(migration, /CREATE TYPE "BoardScope"/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "board_stages"/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "stage_id" TEXT/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "board_position" INTEGER NOT NULL DEFAULT 0/);
  assert.match(migration, /CONSTRAINT "tasks_stage_id_fkey"/);
  assert.doesNotMatch(migration, /DROP (?:TABLE|COLUMN|TYPE)/);
});

test('production migration installs every default board stage idempotently', () => {
  for (const code of [
    'TASKS_OPEN',
    'TASKS_IN_PROGRESS',
    'TASKS_WAITING',
    'TASKS_DONE',
    'TICKETS_DRAFT',
    'TICKETS_SUBMITTED',
    'TICKETS_MANAGER_REVIEW',
    'TICKETS_BRANCH_REVIEW',
    'TICKETS_IN_PROGRESS',
    'TICKETS_RESOLVED',
    'TICKETS_CLOSED',
    'TICKETS_REOPENED',
    'TICKETS_REJECTED',
  ]) {
    assert.match(migration, new RegExp(`'${code}'`));
  }
  assert.match(migration, /ON CONFLICT \("code"\) DO UPDATE SET/);
});

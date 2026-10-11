import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  'packages/database/prisma/migrations/20260725120000_default_departments/migration.sql',
  'utf8',
);

test('production migration installs every default department', () => {
  for (const code of [
    'SALES',
    'SERVICE',
    'PARTS',
    'BODY_PAINT',
    'FINANCE',
    'CUSTOMER_CARE',
  ]) {
    assert.match(migration, new RegExp(`'${code}'`));
  }
  assert.equal((migration.match(/NULL, true, CURRENT_TIMESTAMP/g) ?? []).length, 6);
});

test('department defaults are idempotent and preserve existing master data', () => {
  assert.match(migration, /ON CONFLICT \("code"\) DO NOTHING/);
  assert.doesNotMatch(migration, /\b(?:DELETE|DROP|TRUNCATE|UPDATE)\b/);
  assert.doesNotMatch(migration, /"(?:users|customers|vehicles|complaints)"/i);
});

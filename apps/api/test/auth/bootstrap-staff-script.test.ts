import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('apps/api/scripts/bootstrap-staff.ts', 'utf8');

test('staff bootstrap requires operator credentials and stores only an argon2 hash', () => {
  assert.match(source, /CMS_BOOTSTRAP_EMAIL/);
  assert.match(source, /CMS_BOOTSTRAP_PASSWORD/);
  assert.match(source, /password\.length < 12/);
  assert.match(source, /argon2\.hash\(password, \{ type: argon2\.argon2id \}\)/);
  assert.doesNotMatch(source, /DEV_STAFF_PASSWORD_HASH|ChangeMe|password123|console\.log\([^)]*password/i);
});

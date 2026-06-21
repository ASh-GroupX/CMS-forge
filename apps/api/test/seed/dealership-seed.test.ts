import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const seed = [
  '../../../../packages/database/prisma/seed.ts',
  '../../../../packages/database/prisma/phase10-seed.ts',
].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8')).join('\n');

test('phase 10 dealership seed covers demo data and confidential ACL intent', () => {
  for (const marker of [
    'seed_deal_active',
    'seed_deal_stuck',
    'seed_task_overdue_promise',
    'seed_task_internal_confidential',
    'seed_case_employee_grievance',
    'seed_case_note_hr',
  ]) {
    assert.match(seed, new RegExp(marker));
  }

  assert.match(seed, /CaseType\.EMPLOYEE_GRIEVANCE/);
  assert.match(seed, /CaseConfidentialityLevel\.CONFIDENTIAL/);
  assert.match(seed, /CaseParticipantRole\.ACCUSED/);
  assert.match(seed, /TaskConfidentialityLevel\.CONFIDENTIAL/);
  assert.match(seed, /DealStage\.BOOKING/);
  assert.match(seed, /blocker: 'Finance approval missing'/);
});

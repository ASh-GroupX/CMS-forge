import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const seed = readFileSync(
  new URL('../../../../packages/database/prisma/seed.ts', import.meta.url),
  'utf8',
);

const staffEmails = [
  'admin@cms-auto.test',
  'cr.manager@cms-auto.test',
  'officer.main@cms-auto.test',
  'branch.mgr.north@cms-auto.test',
];

test('staff seed users have Argon2id hashes and no plaintext password fields', () => {
  const hash = seed.match(/DEV_STAFF_PASSWORD_HASH =\n\s+'([^']+)';/)?.[1];
  assert.match(hash ?? '', /^\$argon2id\$v=19\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  assert.doesNotMatch(seed, /\bpassword\s*:/);
  assert.doesNotMatch(seed, /plain(text)?password/i);

  for (const email of staffEmails) {
    assert.match(seed, new RegExp(`email: '${email}'`));
  }

  const staffSection = seed.slice(seed.indexOf('Staff users'), seed.indexOf('Categories'));
  assert.equal(staffSection.match(/passwordHash: DEV_STAFF_PASSWORD_HASH/g)?.length, 8);
});

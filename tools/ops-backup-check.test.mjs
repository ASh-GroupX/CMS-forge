import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { checkBackupReadiness, formatBackupReport } from './ops-backup-check.mjs';

test('ops backup check passes for deterministic local development posture', () => {
  const result = checkBackupReadiness({ env: { NODE_ENV: 'development' } });
  const report = formatBackupReport(result);

  assert.deepEqual(result.errors, []);
  assert.match(report, /ops backup check passed for development/);
  assert.match(report, /POSTGRES_HOST_AUTH_METHOD defaults to trust and is allowed only for local development/);
  assert.doesNotMatch(report, /cms_auto_dev|postgres:\/\/|redis:\/\//);
});

test('ops backup check fails loudly when dev trust auth is used for non-dev', () => {
  const result = checkBackupReadiness({ env: { CMS_ENV: 'production' } });
  const report = formatBackupReport(result);

  assert.match(report, /ops backup check failed for production/);
  assert.match(report, /POSTGRES_HOST_AUTH_METHOD=trust is forbidden/);
  assert.doesNotMatch(report, /cms_auto_dev|postgres:\/\/|redis:\/\//);
});

test('ops backup check allows non-dev when postgres auth method is explicitly hardened', () => {
  const result = checkBackupReadiness({ env: { CMS_ENV: 'production', POSTGRES_HOST_AUTH_METHOD: 'scram-sha-256' } });
  const report = formatBackupReport(result);

  assert.deepEqual(result.errors, []);
  assert.match(report, /postgres host authentication is parameterized/);
  assert.match(report, /ops backup check passed for production/);
});

test('ops backup check CLI exits nonzero for unsafe non-dev posture without printing secrets', () => {
  const result = spawnSync(process.execPath, ['tools/ops-backup-check.mjs'], {
    encoding: 'utf8',
    env: { ...process.env, CMS_ENV: 'staging' },
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /ops backup check failed for staging/);
  assert.match(result.stderr, /POSTGRES_HOST_AUTH_METHOD=trust is forbidden/);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /cms_auto_dev|postgres:\/\/|redis:\/\//);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { checkProductionConfig, readEnvFile } from './prod-config-check.mjs';

const composeText = `
services:
  api:
    environment:
      EMAIL_PROVIDER_DRIVER: smtp
      ATTACHMENT_STORAGE_DRIVER: s3
`;

const realEnv = {
  SITE_DOMAIN: 'cms.company.test',
  ACME_EMAIL: 'ops@company.test',
  POSTGRES_DB: 'cms_auto',
  POSTGRES_USER: 'cms_auto',
  POSTGRES_PASSWORD: 'random-postgres-password',
  REDIS_PASSWORD: 'random-redis-password',
  ATTACHMENT_S3_ENDPOINT: 'https://r2.company.test',
  ATTACHMENT_S3_REGION: 'auto',
  ATTACHMENT_S3_BUCKET: 'cms-auto-attachments',
  ATTACHMENT_S3_ACCESS_KEY_ID: 'r2-access-key',
  ATTACHMENT_S3_SECRET_ACCESS_KEY: 'r2-secret-key',
  ATTACHMENT_S3_FORCE_PATH_STYLE: 'false',
  ATTACHMENT_DOWNLOAD_TTL_SECONDS: '300',
  SMTP_HOST: 'smtp.company.test',
  SMTP_PORT: '587',
  SMTP_FROM: 'CMS Auto <support@company.test>',
  SMTP_USER: 'smtp-user',
  SMTP_PASSWORD: 'random-smtp-password',
  SMTP_SECURE: 'false',
};

test('production config check passes for real SMTP and S3 values', () => {
  assert.deepEqual(checkProductionConfig({ env: realEnv, composeText }), { ok: true, errors: [] });
});

test('production config check allows the example env only in placeholder mode', () => {
  const env = readEnvFile('.env.production.example');
  assert.equal(checkProductionConfig({ env, composeText, allowPlaceholders: true }).ok, true);
  assert.equal(checkProductionConfig({ env, composeText }).ok, false);
});

test('production config check rejects dev storage or email drivers', () => {
  const badCompose = composeText.replace('smtp', 'in-memory').replace('s3', 'memory');
  const result = checkProductionConfig({ env: realEnv, composeText: badCompose });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /EMAIL_PROVIDER_DRIVER=smtp/);
  assert.match(result.errors.join('\n'), /ATTACHMENT_STORAGE_DRIVER=s3/);
});

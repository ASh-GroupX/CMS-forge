import { readFileSync } from 'node:fs';

const requiredEnv = [
  'SITE_DOMAIN',
  'ACME_EMAIL',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'REDIS_PASSWORD',
  'ATTACHMENT_S3_ENDPOINT',
  'ATTACHMENT_S3_REGION',
  'ATTACHMENT_S3_BUCKET',
  'ATTACHMENT_S3_ACCESS_KEY_ID',
  'ATTACHMENT_S3_SECRET_ACCESS_KEY',
  'ATTACHMENT_S3_FORCE_PATH_STYLE',
  'ATTACHMENT_DOWNLOAD_TTL_SECONDS',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_FROM',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_SECURE',
];

const placeholderPattern = /replace-with|example\.com|cms_auto_dev|cms_auto_minio_dev|\btrust\b/i;

export function checkProductionConfig({
  env = process.env,
  composeText = readFileSync('docker-compose.prod.yml', 'utf8'),
  allowPlaceholders = false,
} = {}) {
  const errors = [];

  for (const name of requiredEnv) {
    if (!String(env[name] ?? '').trim()) errors.push(`${name} is required`);
  }

  if (!allowPlaceholders) {
    for (const name of requiredEnv) {
      const value = String(env[name] ?? '');
      if (placeholderPattern.test(value)) errors.push(`${name} must be a real production value`);
    }
  }

  if (!/EMAIL_PROVIDER_DRIVER:\s*smtp/.test(composeText)) {
    errors.push('production compose must force EMAIL_PROVIDER_DRIVER=smtp');
  }
  if (!/ATTACHMENT_STORAGE_DRIVER:\s*s3/.test(composeText)) {
    errors.push('production compose must force ATTACHMENT_STORAGE_DRIVER=s3');
  }
  if (/POSTGRES_HOST_AUTH_METHOD|cms_auto_dev|ATTACHMENT_STORAGE_DRIVER:\s*memory|EMAIL_PROVIDER_DRIVER:\s*in-memory/.test(composeText)) {
    errors.push('production compose must not contain dev auth, storage, or email defaults');
  }

  return { ok: errors.length === 0, errors };
}

export function readEnvFile(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index <= 0) continue;
    env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
  return env;
}

if (process.argv[1]?.endsWith('prod-config-check.mjs')) {
  const envFileIndex = process.argv.indexOf('--env-file');
  const env = envFileIndex >= 0 ? readEnvFile(process.argv[envFileIndex + 1]) : process.env;
  const result = checkProductionConfig({ env, allowPlaceholders: process.argv.includes('--allow-placeholders') });
  if (!result.ok) {
    for (const error of result.errors) console.error(error);
    process.exit(1);
  }
  console.log('Production config check passed');
}

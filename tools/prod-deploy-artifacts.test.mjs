import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const compose = readFileSync('docker-compose.prod.yml', 'utf8');
const caddy = readFileSync('Caddyfile', 'utf8');
const envExample = readFileSync('.env.production.example', 'utf8');

test('production deploy artifacts define the required pilot stack', () => {
  for (const service of ['caddy', 'web', 'api', 'migrate', 'worker', 'postgres', 'redis']) {
    assert.match(compose, new RegExp(`\\n  ${service}:\\n`));
  }

  assert.match(compose, /EMAIL_PROVIDER_DRIVER:\s*smtp/);
  assert.match(compose, /ATTACHMENT_STORAGE_DRIVER:\s*s3/);
  assert.match(compose, /condition:\s*service_healthy/);
  assert.match(caddy, /\{\$SITE_DOMAIN\}/);
  assert.match(caddy, /handle_path \/api\/\*/);
});

test('production deploy artifacts gate startup on migrations and healthchecks', () => {
  assert.match(compose, /migrate:[\s\S]*prisma\/build\/index\.js[\s\S]*migrate[\s\S]*deploy/);
  assert.match(compose, /api:[\s\S]*migrate:[\s\S]*condition:\s*service_completed_successfully/);

  for (const service of ['caddy', 'web', 'api', 'worker', 'postgres', 'redis']) {
    assert.match(compose, new RegExp(`\\n  ${service}:\\n[\\s\\S]*?healthcheck:`));
    assert.match(compose, new RegExp(`\\n  ${service}:\\n[\\s\\S]*?restart: unless-stopped`));
  }

  assert.match(caddy, /:8080\s*\{[\s\S]*respond \/health "ok"/);
});

test('production deploy artifacts avoid dev trust and committed secrets', () => {
  assert.doesNotMatch(compose, /POSTGRES_HOST_AUTH_METHOD|cms_auto_dev|trust/);
  assert.doesNotMatch(envExample, /cms_auto_dev|cms_auto_minio_dev|trust/);

  for (const name of ['POSTGRES_PASSWORD', 'REDIS_PASSWORD', 'SMTP_PASSWORD', 'ATTACHMENT_S3_SECRET_ACCESS_KEY']) {
    assert.match(envExample, new RegExp(`${name}=replace-with-`));
  }
});

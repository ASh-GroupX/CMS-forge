import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const compose = readFileSync('docker-compose.prod.yml', 'utf8').replace(/\r\n/g, '\n');
const caddy = readFileSync('Caddyfile', 'utf8').replace(/\r\n/g, '\n');
const envExample = readFileSync('.env.production.example', 'utf8').replace(/\r\n/g, '\n');
const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8').replace(/\r\n/g, '\n');

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

  assert.match(workflow, /config --quiet/);
  assert.match(workflow, /node tools\/prod-config-check\.mjs --env-file/);
  assert.doesNotMatch(workflow, /corepack enable/);
  assert.doesNotMatch(workflow, /docker image prune/);
  assert.match(compose, /127\.0\.0\.1:8080:80/);
});

test('production deployment verifies that the public domain reaches its stack', () => {
  assert.match(workflow, /PRODUCTION_SITE_DOMAIN: cms\.laith-alobaidi-crm\.com/);
  assert.match(workflow, /test "\$SITE_DOMAIN" = '\$\{\{ env\.PRODUCTION_SITE_DOMAIN \}\}'/);
  assert.match(workflow, /DEPLOYMENT_SHA='\$\{\{ github\.sha \}\}'/);
  assert.match(compose, /com\.cms-auto\.revision: \$\{DEPLOYMENT_SHA:-manual\}/);
  assert.match(caddy, /X-CMS-Deployment "\{\$DEPLOYMENT_SHA\}"/);
  assert.match(workflow, /127\.0\.0\.1:8080/);
  assert.match(workflow, /test "\$PUBLIC_SHA" = "\$DEPLOYMENT_SHA"/);
  assert.match(workflow, /https:\/\/\$SITE_DOMAIN\/api\/health/);
});

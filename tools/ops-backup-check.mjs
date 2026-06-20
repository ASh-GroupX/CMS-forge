import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_RUNBOOK_MARKERS = [
  'database backup schedule',
  'restore test steps',
  'attachment backup or replication plan',
  'rpo: 24 hours',
  'rto: 8 business hours',
  'no secret values',
];

const REQUIRED_OPERATIONS_MARKERS = [
  'local setup',
  'deployment',
  'migration',
  'rollback',
  'environment variables',
  'backup and restore',
  'monitoring',
  'incident response',
  'security',
  'dms integration',
  'notification providers',
  'data retention',
  'https redirect',
  'postgres_host_auth_method',
  'no secret values',
];

function readRequiredFile(root, relativePath, errors) {
  const absolutePath = path.join(root, relativePath);

  if (!fs.existsSync(absolutePath)) {
    errors.push(`Missing required backup proof file: ${relativePath}`);
    return '';
  }

  return fs.readFileSync(absolutePath, 'utf8');
}

function deploymentEnvironment(env) {
  return String(env.CMS_ENV ?? env.APP_ENV ?? env.NODE_ENV ?? 'development').toLowerCase();
}

function isNonDev(envName) {
  return ['production', 'prod', 'staging', 'stage'].includes(envName);
}

function hasPostgresVolume(composeText) {
  return (
    /postgres-data:\s*[\r\n]/.test(composeText) &&
    /-\s*postgres-data:\/var\/lib\/postgresql\/data/.test(composeText)
  );
}

function postgresAuthMethod(composeText, env) {
  const match = composeText.match(/POSTGRES_HOST_AUTH_METHOD:\s*([^\r\n]+)/);
  const raw = match?.[1]?.trim() ?? '';
  const parameterized = raw.includes('${POSTGRES_HOST_AUTH_METHOD:-trust}');

  return {
    defaultTrust: raw === 'trust' || parameterized,
    effective: env.POSTGRES_HOST_AUTH_METHOD?.toLowerCase() ?? (parameterized ? 'trust' : raw.toLowerCase()),
    parameterized,
    present: Boolean(match),
  };
}

function missingMarkers(text, markers) {
  const normalized = text.toLowerCase();
  return markers.filter((marker) => !normalized.includes(marker));
}

export function checkBackupReadiness({ root = process.cwd(), env = process.env } = {}) {
  const errors = [];
  const warnings = [];
  const checks = [];

  const composeText = readRequiredFile(root, 'docker-compose.yml', errors);
  const schemaText = readRequiredFile(root, 'packages/database/prisma/schema.prisma', errors);
  const openApiText = readRequiredFile(root, 'packages/contracts/openapi.json', errors);
  const runbookText = readRequiredFile(root, 'docs/operations/backup.md', errors);
  const operationsText = readRequiredFile(root, 'docs/operations/runbook.md', errors);
  const envName = deploymentEnvironment(env);
  const nonDev = isNonDev(envName);

  if (/^\s*postgres:\s*$/m.test(composeText)) {
    checks.push('postgres service declared');
  } else {
    errors.push('docker-compose.yml must declare a postgres service');
  }

  if (hasPostgresVolume(composeText)) {
    checks.push('postgres data is on a named volume');
  } else {
    errors.push('postgres service must persist data on the postgres-data named volume');
  }

  if (/DATABASE_URL:\s*\S+/m.test(composeText) && /REDIS_URL:\s*\S+/m.test(composeText)) {
    checks.push('api service declares database and redis connection env vars');
  } else {
    errors.push('api service must declare DATABASE_URL and REDIS_URL');
  }

  const authMethod = postgresAuthMethod(composeText, env);
  if (!authMethod.present) {
    errors.push('docker-compose.yml must declare POSTGRES_HOST_AUTH_METHOD');
  } else if (!authMethod.parameterized) {
    errors.push('POSTGRES_HOST_AUTH_METHOD must be parameterized for non-dev deployments');
  } else if (nonDev && authMethod.effective === 'trust') {
    errors.push('POSTGRES_HOST_AUTH_METHOD=trust is forbidden for staging/production backup posture');
  } else if (!nonDev && authMethod.defaultTrust) {
    warnings.push('POSTGRES_HOST_AUTH_METHOD defaults to trust and is allowed only for local development');
  } else {
    checks.push('postgres host authentication is parameterized for non-dev deployments');
  }

  if (/provider\s*=\s*"postgresql"/.test(schemaText) && /url\s*=\s*env\("DATABASE_URL"\)/.test(schemaText)) {
    checks.push('Prisma schema uses PostgreSQL through DATABASE_URL');
  } else {
    errors.push('Prisma schema must use PostgreSQL and env("DATABASE_URL")');
  }

  try {
    const openApi = JSON.parse(openApiText);
    if (openApi.paths?.['/health']?.get && openApi.paths?.['/']?.get) {
      checks.push('health endpoints are present in the OpenAPI contract');
    } else {
      errors.push('OpenAPI contract must include GET / and GET /health');
    }
  } catch {
    errors.push('OpenAPI contract must be valid JSON');
  }

  const missingRunbookMarkers = missingMarkers(runbookText, REQUIRED_RUNBOOK_MARKERS);
  if (missingRunbookMarkers.length === 0) {
    checks.push('backup runbook documents schedule, restore, attachment plan, RPO/RTO, and secret handling');
  } else {
    errors.push(`Backup runbook missing required marker(s): ${missingRunbookMarkers.join(', ')}`);
  }

  const missingOperationsMarkers = missingMarkers(operationsText, REQUIRED_OPERATIONS_MARKERS);
  if (missingOperationsMarkers.length === 0) {
    checks.push('operations runbook covers deployment, security, monitoring, providers, and retention');
  } else {
    errors.push(`Operations runbook missing required marker(s): ${missingOperationsMarkers.join(', ')}`);
  }

  return { checks, envName, errors, warnings };
}

export function formatBackupReport(result) {
  const lines = [];

  for (const check of result.checks) {
    lines.push(`ok - ${check}`);
  }

  for (const warning of result.warnings) {
    lines.push(`warn - ${warning}`);
  }

  if (result.errors.length === 0) {
    lines.push(`ops backup check passed for ${result.envName}`);
  } else {
    lines.push(`ops backup check failed for ${result.envName}`);
    for (const error of result.errors) {
      lines.push(`error - ${error}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function main() {
  const result = checkBackupReadiness();
  const report = formatBackupReport(result);

  if (result.errors.length === 0) {
    process.stdout.write(report);
    return;
  }

  process.stderr.write(report);
  process.exitCode = 1;
}

const entryPath = process.argv[1] ? fileURLToPath(import.meta.url) : '';

if (entryPath === process.argv[1]) {
  main();
}

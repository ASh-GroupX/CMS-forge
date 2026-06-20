import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function apiSuite(name, label, nodeExecutable) {
  return {
    label,
    command: nodeExecutable,
    args: ['tools/api-test.mjs', name],
  };
}

function auditSuite(nodeExecutable) {
  return {
    label: 'api audit redaction and RBAC',
    command: nodeExecutable,
    args: ['--import', 'tsx', '--test', 'apps/api/test/audit/search.test.ts'],
    env: { TSX_TSCONFIG_PATH: 'apps/api/tsconfig.json' },
  };
}

export function securityProofCommands(nodeExecutable = process.execPath) {
  return [
    apiSuite('auth', 'api auth session/password/reset security', nodeExecutable),
    apiSuite('admin', 'api admin RBAC and CSRF security', nodeExecutable),
    apiSuite('security', 'api CSRF and rate-limit security', nodeExecutable),
    auditSuite(nodeExecutable),
    apiSuite('portal', 'portal submission privacy security', nodeExecutable),
    apiSuite('portal.tracking', 'portal tracking verification privacy', nodeExecutable),
    apiSuite('attachments', 'attachment authorization and scan policy', nodeExecutable),
    apiSuite('reports', 'report authorization and scoped export security', nodeExecutable),
  ];
}

export function runSecurityCheck({
  commands = securityProofCommands(),
  runner = spawnSync,
  logger = console,
  stdio = 'inherit',
} = {}) {
  for (const proof of commands) {
    logger.log(`security check: ${proof.label}`);
    const result = runner(proof.command, proof.args, {
      env: proof.env ? { ...process.env, ...proof.env } : process.env,
      shell: false,
      stdio,
    });
    const status = typeof result.status === 'number' ? result.status : 1;

    if (status !== 0) {
      logger.error(`security check failed: ${proof.label}`);
      return { failed: proof.label, status };
    }
  }

  logger.log('security check passed');
  return { status: 0 };
}

function main() {
  const result = runSecurityCheck();
  process.exitCode = result.status;
}

const entryPath = process.argv[1] ? fileURLToPath(import.meta.url) : '';

if (entryPath === process.argv[1]) {
  main();
}

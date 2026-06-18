import { spawnSync } from 'node:child_process';

const databaseUrl = 'postgresql://cms_auto:cms_auto_dev@postgres:5432/cms_auto?schema=public';
const rowId = `audit_append_only_${Date.now()}`;

run('docker', ['compose', 'up', '-d', 'postgres']);
run('docker', [
  'run',
  '--rm',
  '--network',
  'cms-forge_default',
  '-v',
  `${process.cwd()}:/workspace:ro`,
  '-w',
  '/workspace',
  '-e',
  `DATABASE_URL=${databaseUrl}`,
  'node:20-bookworm-slim',
  'sh',
  '-lc',
  'apt-get update >/dev/null && apt-get install -y openssl >/dev/null && npm exec --yes prisma@5.22.0 -- migrate deploy --schema packages/database/prisma/schema.prisma',
]);

run('docker', [
  'compose',
  'exec',
  '-T',
  'postgres',
  'psql',
  '-U',
  'cms_auto',
  '-d',
  'cms_auto',
  '-v',
  'ON_ERROR_STOP=1',
], appendOnlySql(rowId));

console.log('Audit append-only proof passed');

function run(command, args, input) {
  const result = spawnSync(command, args, {
    input,
    shell: false,
    stdio: input ? ['pipe', 'inherit', 'inherit'] : 'inherit',
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit ${result.status ?? 'unknown'}`);
  }
}

function appendOnlySql(id) {
  return `
INSERT INTO audit_logs (id, event_type, action, target_type, correlation_id)
VALUES ('${id}', 'SECURITY', 'append_only_probe', 'audit_logs', 'req_append_only_probe');

DO $$
DECLARE blocked boolean := false;
BEGIN
  BEGIN
    UPDATE audit_logs SET action = 'mutated' WHERE id = '${id}';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%append-only%' THEN
      blocked := true;
    ELSE
      RAISE;
    END IF;
  END;

  IF NOT blocked THEN
    RAISE EXCEPTION 'audit log update was not blocked';
  END IF;
END $$;

DO $$
DECLARE blocked boolean := false;
BEGIN
  BEGIN
    DELETE FROM audit_logs WHERE id = '${id}';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%append-only%' THEN
      blocked := true;
    ELSE
      RAISE;
    END IF;
  END;

  IF NOT blocked THEN
    RAISE EXCEPTION 'audit log delete was not blocked';
  END IF;
END $$;
`;
}

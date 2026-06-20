# Backup And Restore Runbook

This runbook is the deterministic pilot baseline for NFR-AVAIL-001 and
NFR-DATA-001. It does not contain secret values.

## Database Backup Schedule

- Schedule: run a PostgreSQL logical backup at least once every 24 hours for the
  MVP pilot database.
- Retention: keep daily backups for 14 days and weekly backups for 8 weeks until
  a legal retention policy replaces this pilot baseline.
- RPO: 24 hours or better.
- RTO: 8 business hours or better.
- Storage: write backup artifacts to encrypted backup storage outside the
  database host. Keep at least one restore-test copy separate from the primary
  application stack.

## Hostinger Backup Command Shape

Run from the VPS with `.env.production` loaded by a root-owned or deploy-user
cron. Do not print the resulting database URL in logs.

```bash
set -eu
cd /opt/cms-auto
set -a
. ./.env.production
set +a
mkdir -p /var/backups/cms-auto/postgres
backup_file="/var/backups/cms-auto/postgres/cms-auto-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$backup_file"
chmod 600 "$backup_file"
```

Upload the backup to the approved offsite encrypted storage after creation. The
operations log records only the backup timestamp, size, checksum, storage
provider name, and result.

## Restore Test Steps

1. Provision a staging PostgreSQL database with no production application traffic.
2. Restore the latest backup into staging using the approved PostgreSQL restore
   command for the chosen backup format.
3. Run migrations in check mode against the restored staging database.
4. Start the API against staging and confirm `GET /health` returns healthy.
5. Run the reporting and portal smoke suites against the restored data.
6. Record the backup timestamp, restore start/end time, operator, result, and
   any data gaps in the pilot operations log.

Command shape for a restore test:

```bash
createdb "$RESTORE_TEST_DB"
pg_restore --clean --if-exists --no-owner --dbname "$RESTORE_TEST_DATABASE_URL" "$BACKUP_FILE"
DATABASE_URL="$RESTORE_TEST_DATABASE_URL" corepack pnpm prisma:validate
```

## Attachment Backup Or Replication Plan

The current local adapter is in-memory and is not acceptable for non-dev file
retention. Before pilot attachments are enabled end to end, configure the real
object-storage adapter with bucket versioning or equivalent replication, encrypted
storage, and daily recovery checks. Attachment metadata remains in PostgreSQL and
is covered by the database backup schedule.

## Object Storage Operations

Preferred pilot storage is Cloudflare R2 or another S3-compatible bucket. Enable:

- private bucket access only;
- bucket versioning or provider-equivalent object recovery;
- encryption at rest;
- least-privilege access keys scoped to the attachment bucket;
- lifecycle retention aligned with the pilot retention decision.

Smoke check command shape:

```bash
corepack pnpm prod:config:check -- --env-file .env.production
docker compose --env-file .env.production -f docker-compose.prod.yml config
```

Then upload one pilot attachment through the app, mark it `CLEAN`, download it
through the app, and confirm the object exists in the bucket provider console.
Record only non-secret metadata: object key prefix, upload time, file size,
download result, and operator.

Do not record access keys, signed URLs, raw bucket URLs, customer file contents,
or screenshots exposing customer PII.

## Non-Dev Safety

- `POSTGRES_HOST_AUTH_METHOD=trust` is local-development only and must fail any
  staging or production backup posture check.
- Production and staging must use secret-managed database passwords or workload
  identity; environment documentation must use variable names only.
- No secret values, connection URLs, OTPs, tokens, or provider credentials belong
  in this runbook, logs, or proof output.

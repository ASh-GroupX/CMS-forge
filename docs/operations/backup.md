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

## Restore Test Steps

1. Provision a staging PostgreSQL database with no production application traffic.
2. Restore the latest backup into staging using the approved PostgreSQL restore
   command for the chosen backup format.
3. Run migrations in check mode against the restored staging database.
4. Start the API against staging and confirm `GET /health` returns healthy.
5. Run the reporting and portal smoke suites against the restored data.
6. Record the backup timestamp, restore start/end time, operator, result, and
   any data gaps in the pilot operations log.

## Attachment Backup Or Replication Plan

The current local adapter is in-memory and is not acceptable for non-dev file
retention. Before pilot attachments are enabled end to end, configure the real
object-storage adapter with bucket versioning or equivalent replication, encrypted
storage, and daily recovery checks. Attachment metadata remains in PostgreSQL and
is covered by the database backup schedule.

## Non-Dev Safety

- `POSTGRES_HOST_AUTH_METHOD=trust` is local-development only and must fail any
  staging or production backup posture check.
- Production and staging must use secret-managed database passwords or workload
  identity; environment documentation must use variable names only.
- No secret values, connection URLs, OTPs, tokens, or provider credentials belong
  in this runbook, logs, or proof output.

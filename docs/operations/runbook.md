# CMS-Auto Operations Runbook

This pilot runbook is for operators and deployment owners. It lists variable
names and operational responsibilities only; it contains no secret values.

## Local Setup

1. Install Node.js 20+, Corepack, Docker, and the package manager version pinned
   in `package.json`.
2. Start local dependencies with `docker compose up -d postgres redis`.
3. Set `DATABASE_URL`, `REDIS_URL`, `API_URL`, and port variables in the local
   shell or environment manager.
4. Run `corepack pnpm db:seed` only against local or staging test databases.

## Deployment

Build with `corepack pnpm build` from a clean commit. Deploy API, web, database
migration job, Redis, PostgreSQL, and object storage through the approved pilot
environment. Production and staging must not reuse local compose defaults as an
infrastructure security boundary.

## Migration

Run Prisma migrations before routing user traffic to a new API build. Verify the
generated OpenAPI contract with `corepack pnpm openapi:check` and keep a database
backup from before the migration window.

## Rollback

Rollback restores the previous API/web artifact and, when schema changes are not
backward compatible, restores the pre-migration database backup into staging
first for validation. Record rollback start time, operator, affected version,
database backup identifier, and business approval.

## Environment Variables

Document variable names without values: `DATABASE_URL`, `REDIS_URL`, `API_URL`,
`PORT`, `NODE_ENV`, `CMS_ENV`, `POSTGRES_DB`, `POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_HOST_AUTH_METHOD`, mail/SMS/WhatsApp provider
configuration names, object-storage bucket names, and gateway host names.

## Backup And Restore

Use `docs/operations/backup.md` for the database backup schedule, restore test
steps, attachment backup or replication plan, and RPO/RTO targets. Run
`corepack pnpm ops:backup:check` before pilot sign-off.

## Monitoring

Monitor `GET /health`, API error rates, job failures, notification dispatch
failures, integration adapter failures, SLA warning/breach jobs, database
storage, Redis availability, and export volume. Preserve correlation IDs from
API responses in incident tickets.

## Incident Response

Collect the correlation ID, route, role, branch, approximate time, deployment
version, and safe screenshots. Do not attach passwords, OTP values, tokens,
session cookies, provider credentials, or full attachment contents to tickets.

## Security

The production gateway must enforce TLS and HTTP to HTTPS redirect before pilot
traffic is allowed. Cookies must remain HttpOnly and secure in production.
`POSTGRES_HOST_AUTH_METHOD` must be set to a non-trust value such as
`scram-sha-256` or `md5` for staging and production.

## DMS Integration

Configure DMS integration through backend adapters only. Use test mode in
staging, record provider failures with correlation IDs, and keep manual
customer/vehicle fallback available when DMS is unavailable.

## Notification Providers

Configure email, SMS, and WhatsApp provider variables through secret management.
Templates must be reviewed in Arabic and English before activation. Failed
delivery attempts must remain visible for retry and investigation.

## Data Retention

Complaint, attachment, notification, survey, and audit retention values must be
approved before deletion jobs are enabled. Deletion and anonymization jobs remain
disabled during pilot until the business/legal policy is approved.

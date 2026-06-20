# Pilot Smoke And UAT Checklist

Use this checklist after the Hostinger stack is deployed with real
`.env.production` values. It records non-secret proof only.

## Preflight Gates

- `corepack pnpm prod:config:check -- --env-file .env.production` passes.
- `docker compose --env-file .env.production -f docker-compose.prod.yml ps`
  shows API, web, worker, Postgres, Redis, and Caddy healthy/running.
- `migrate` completed successfully for the deployed revision.
- `curl -fsS "https://$SITE_DOMAIN/api/health"` returns `status: ok`.
- `curl -fsS "https://$SITE_DOMAIN/"` returns the web app.

## Staff Smoke

- Staff login works for one approved pilot user.
- Staff shell navigation renders in English LTR and Arabic RTL.
- Work queue loads real deployed data and branch scope is correct.
- Complaint detail loads without exposing unrelated branch data.
- Reports dashboard loads and export remains scoped/row-limited.
- Audit viewer is Admin-only.

## Portal Smoke

- Portal submission creates a complaint and returns a reference.
- Portal tracking requires verification before showing status.
- Portal tracking does not show internal comments, audit entries, DMS codes, or
  staff PII.
- Survey link accepts one submission and rejects reuse/expired access.

## Runtime Smoke

- Worker logs show SLA and notification queues connected.
- One overdue seeded complaint produces warning/breach behavior in the deployed
  environment.
- One clean attachment is uploaded, marked `CLEAN`, downloaded through the app,
  and confirmed present in object storage.
- Backup job creates a database backup artifact and one restore test completes
  in staging.
- `corepack pnpm smtp:proof` sends one real staging/production email and a human
  confirms mailbox arrival outside spam.

## Evidence To Record

Record only:

- deploy commit SHA;
- environment name;
- operator;
- UTC timestamps;
- command names and pass/fail labels;
- redacted complaint reference if needed;
- backup timestamp/checksum/size;
- SMTP proof id and redacted recipient domain;
- human UAT sign-off name or role.

Do not record customer PII, real email addresses, credentials, OTPs, session
cookies, signed URLs, raw provider logs, IP addresses, or mailbox screenshots.

## Phase 9 Handoff

Phase 9 must not go to phase review while these are open:

- P9-06C live SMTP arrival proof is not recorded.
- VPS deployment is not actually run.
- Backup restore is not tested.
- Object storage smoke is not proven.
- Pilot staff UAT is not signed off.

If any gate remains open, leave Forge in `Blocked` or write the smallest human
gate task instead of marking Phase 9 complete.

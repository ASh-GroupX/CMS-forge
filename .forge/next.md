# READY-P9-VPS-PROVISIONING Deployment Package Ready

Status: Blocked
Required model tier: HUMAN
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Risk: High

## Context

P9-07 and P9-08 are complete. P9-06C-HUMAN was explicitly skipped by the user
only to continue buildable Forge work. There is no VPS yet, so the repository is
deployment-ready but not production-proven. Phase 9 cannot honestly complete or
enter phase review until a real environment exists and proof is recorded.

## Scope

Human action required when a VPS/domain/sender exist:

1. Provide real `.env.production` on the VPS and run
   `corepack pnpm prod:config:check -- --env-file .env.production`.
2. Deploy on Hostinger with
   `docker compose --env-file .env.production -f docker-compose.prod.yml up -d`.
3. Prove HTTPS/web/API/worker/migrate health from the deployed domain.
4. Run and record backup creation plus one restore test.
5. Prove one S3/R2 attachment upload/download smoke.
6. Run `corepack pnpm smtp:proof` and confirm mailbox arrival outside spam.
7. Run the pilot smoke/UAT checklist with real staff users.

## Acceptance

- The repository stays ready for provisioning: production compose, Caddy,
  `.env.production.example`, config checks, first-deploy runbook, backup runbook,
  and pilot smoke/UAT checklist are present.
- Non-secret proof metadata is appended to `.forge/evidence.md`.
- P9-06C and P9-06 are checked complete only after real email arrival proof.
- P9-OPS items are checked complete only after real VPS/deploy/UAT proof.
- Phase 9 review starts only after these human gates are complete.

## SRS IDs

NFR-SEC-001, NFR-AVAIL-001, NFR-OBS-001, NFR-DATA-001

## Proof Commands / Runbooks

- `corepack pnpm prod:config:check -- --env-file .env.production`
- `docker compose --env-file .env.production -f docker-compose.prod.yml config`
- `docker compose --env-file .env.production -f docker-compose.prod.yml up -d`
- `corepack pnpm smtp:proof`
- `docs/operations/hostinger-first-deploy.md`
- `docs/operations/backup.md`
- `docs/operations/pilot-smoke-uat.md`

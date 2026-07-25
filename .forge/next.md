# Deploy Default Departments Hotfix

Status: Production-safe migration implemented and verified locally
Required model tier: GPT-5.5 Extra High or equivalent
Risk: High (production reference data and routing availability)
SRS IDs: `REQ-ADMIN-001`, `NFR-DATA-001`, `OPS-RUNBOOK-001`,
`METHOD-TEST-001`

## Task

Deploy migration `20260725120000_default_departments`, then verify an
authenticated administrator and branch-scoped staff member receive the six
active shared departments in task, complaint-routing, and assignment options.
After this hotfix is verified, resume the pending production credential
rotation and multi-role English/Arabic smoke.

## Required Gates

- Passed: the migration inserts all six defaults and is idempotent by code.
- Passed: existing department rows, names, branch ownership, and activation
  choices are preserved on conflict.
- Passed: lint, typecheck, root tests, coverage, and migration sanity.
- Needs Human Review: deploy through the production workflow and confirm the
  pre-migration backup succeeds.
- Needs Human Review: authenticated live department-option checks for admin and
  branch-scoped staff.
- Needs Human Review: rotate PostgreSQL, Redis, SMTP, and object-storage
  credentials and complete the previously scheduled production smoke.

## Proof

- Passed: `node --test tools/departments-migration.test.mjs` (2/2).
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm test` (67/67 and configured coverage thresholds).
- Passed: `corepack pnpm db:migrate:test`.
- Failed (pre-existing, unchanged): `corepack pnpm openapi:check` because the
  committed OpenAPI document differs from its canonical scaffold. This
  migration adds no API route or schema.

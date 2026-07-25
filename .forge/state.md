# Current State

Status: Default department production migration implemented and locally verified
Phase: Production deployment hardening
Next Task: Deploy and authenticate department-option smoke, then resume security closeout
Model Tier: GPT-5.5 Extra High or equivalent

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in `.forge/archive/state-archive.md`.

## Snapshot

- Production deploys Prisma migrations but intentionally does not run the
  development seed, which was the only place creating department rows.
- Migration `20260725120000_default_departments` now inserts Sales, Service,
  Parts, Body & Paint, Finance, and Customer Care as active global departments.
- The migration uses `ON CONFLICT ("code") DO NOTHING`, so repeated deploys are
  safe and existing administrator-managed rows are not overwritten.
- The focused migration test, lint, typecheck, root tests with coverage, and
  migration sanity check pass.
- The repository's committed OpenAPI document remains non-canonical. This is
  pre-existing and unrelated because the hotfix changes no API surface.
- Production credential rotation, authenticated multi-role smoke, off-VPS
  backup proof, and rollback-retention decisions remain pending.

## Current Stop

Publish and deploy the isolated department migration through the production
workflow, verify authenticated department options, then resume the existing
production security closeout.

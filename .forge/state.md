# Current State

Status: Dynamic department assignment fix verified locally
Phase: Production deployment
Next Task: Publish, merge, deploy, and run authenticated production verification
Model Tier: GPT-5.5 Extra High or equivalent

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in `.forge/archive/state-archive.md`.

## Snapshot

- The prior admin branches page displayed department-like preview data but had
  no real department creation endpoint or action.
- Admins can now create active top-level departments through an audited,
  CSRF-protected `MASTER_DATA_MANAGE` endpoint.
- The admin page lists departments from PostgreSQL-backed form options and
  reloads them without cache after creation.
- Generic task assignment and task-board selectors load database rows, include
  active global departments, and filter branch-specific rows by server session.
- Arabic and English names remain data-driven; no department name is hardcoded.
- Local lint, typecheck, root/focused tests, visual proof, and OpenAPI pass.

## Current Stop

Publish and merge the fix into `production`, monitor the production workflow,
then create and verify a uniquely named top-level department in both task
assignment interfaces.

# Current State

Status: Ready to Plan - real admin users and master data queued
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Next Task: P10-ADMIN-REAL
Model Tier: PLANNER-STRONG

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- P10-10B1 is complete. Employee Today and Manager Control Room were proved
  locally against seeded data through API and EN/AR web route smokes.
- P10-10B2 is complete. Deal Handoff Board was proved locally against seeded
  stuck deal data through API and EN/AR web route smokes.
- P10-10B3 is complete. The compiled BullMQ worker processed
  `tasks.escalation.scan`, created one idempotent escalation notification for
  `seed_task_overdue_promise`, and rerun preserved the same row id.
- P10-10B4 is complete. `/reports/kpis` and `/reports` were proved locally; a
  proof-only task/status-history DONE event moved manager KPIs from 0 to 100,
  employee access returned 403, admin was allowed, and north branch scope stayed
  unchanged.
- P10-AUTH-LOCAL is complete. The public staff login surface no longer exposes
  preview sign-in/error shortcuts, real browser requests to `/` no longer bypass
  auth via query preview parameters, and `corepack pnpm staff:bootstrap` creates
  real local staff accounts with operator-supplied credentials and Argon2id
  password hashes.
- P10-DATA-LOCAL is complete. Complaint create now fetches branch/category/
  severity options from the backend session, queue/search rows include readable
  branch and owner names, and OpenAPI documents the new `/complaints/form-options`
  route plus queue/search name fields.
- P10-ADMIN-REAL is selected for planning. Admin users/master-data screens are
  still not real CRUD; account creation outside tests remains the local
  `staff:bootstrap` command until the admin module is built.
- Runtime tasks and deals RBAC denial audit wiring now uses explicit
  Prisma-backed `AuditService` providers so denied reads return 403 with
  SECURITY audit instead of 500.
- B3 worker proof artifacts are under `output/p10-10b3/`; proof notification
  rows and explicit Redis proof jobs were cleaned.
- B4 KPI proof artifacts are under `output/p10-10b4/`; proof sessions and
  proof task/status-history rows were cleaned.
- P10-OPS remains explicitly deferred human-owned production/channel work.
- Local stack assumptions carry forward for remaining P10-10B `[stack]` tasks:
  Docker Postgres/Redis under compose project `cms-forge-local`, host database
  URL `postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto`, host Redis URL
  `redis://localhost:6379`, API on `PORT=3000` when needed, and web at
  `http://localhost:4000`.
- Proof must remain local-first: no production deploy, SMTP, WhatsApp, AI,
  mobile, or HR-platform work.

## Open carry-forward / known debt

- P10-ADMIN-REAL needs planner decomposition before build.
- P10-OPS remains deferred and human-owned: VPS, DNS/TLS, secrets, backups,
  email sender, hardening, deployed smoke/UAT, and future channels.
- The current role model has no explicit HR role; confidential staff access uses
  backend participant ACL plus existing manager/admin-capable staff surfaces.
- Manager rollup batching currently queues one internal manager-scope in-app row
  with no single user recipient; explicit manager user expansion remains
  deferred until a user-directory recipient contract exists.
- Windows service `postgresql-x64-16` still owns host port 5432; keep using 5433
  for this local Docker database unless the service is stopped with admin rights.
- Production deploy remains parked. SMS/WhatsApp/DMS remain mocked.

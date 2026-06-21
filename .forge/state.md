# Current State

Status: Ready to Plan - admin master data queued
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Next Task: P10-ADMIN-MASTER-DATA
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
- P10-ADMIN-REAL admin users slice is complete. The main `/admin` route now uses
  real backend admin user data and active create/deactivate/reactivate controls;
  it no longer shows the old fake branches/departments/users preview with
  disabled action buttons.
- Runtime tasks, deals, and admin RBAC denial paths use explicit Prisma-backed
  `AuditService` providers so denied reads return guarded errors with SECURITY
  audit instead of runtime provider failures.
- The app is running locally: API on `http://localhost:3000`, web on
  `http://localhost:4000`, Docker Postgres on host port `5433`, and Redis on
  `6379`. The in-app browser is signed in to the local admin screen.
- P10-ADMIN-MASTER-DATA is the next local product gap: branches, departments,
  complaint categories, severities/SLA policy, and notification templates still
  need audited backend CRUD plus real admin screens.
- P10-OPS remains explicitly deferred human-owned production/channel work.
- Proof must remain local-first: no production deploy, SMTP, WhatsApp, AI,
  mobile, or HR-platform work.

## Open carry-forward / known debt

- Plan P10-ADMIN-MASTER-DATA before building. Keep it in small backend-first
  slices with OpenAPI, audit, RBAC allow/deny tests, and real UI wiring.
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

# Current State

Status: Ready to Build - admin departments and activation controls queued
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Next Task: P10-ADMIN-MASTER-DATA-B
Model Tier: BUILDER-STRONG

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- P10-AUTH-LOCAL is complete. Real local staff login is active; browser requests
  no longer bypass auth through preview query parameters.
- P10-DATA-LOCAL is complete. Complaint create uses backend session-scoped
  branch/category/severity options and queue rows show readable branch/owner
  names.
- P10-WORK-QUEUE-DROPDOWN-OPTIONS is complete. Work queue dropdowns now expose
  status lifecycle values, row-derived branch values, severity values, and SLA
  state values instead of only `All`.
- P10-ADMIN-REAL is complete. `/admin` uses real backend admin user data with
  create/deactivate/reactivate account controls.
- P10-ADMIN-DROPDOWNS is complete. `/admin` shows live branch/category/severity
  intake values from `/complaints/form-options`.
- P10-ADMIN-MASTER-DATA-A is complete. `/admin` now has active Add/Save controls
  for branches and complaint categories. Branch writes reuse `/branches`; category
  writes use new guarded `/admin/categories` POST/PATCH routes with CONFIG audit
  inside the transaction and OpenAPI coverage.
- The app is running locally: API on `http://localhost:3000`, web on
  `http://localhost:4000`, Docker Postgres on host port `5433`, and Redis on
  `6379`. The API process was rebuilt/restarted after P10-ADMIN-MASTER-DATA-A.
- P10-ADMIN-MASTER-DATA-B is next: department CRUD plus branch
  deactivate/reactivate controls. Severity/SLA policy and notification templates
  remain later slices.
- P10-OPS remains explicitly deferred human-owned production/channel work.
- Proof remains local-first: no production deploy, SMTP, WhatsApp, AI, mobile,
  HR-platform, or VPS work.

## Open carry-forward / known debt

- Departments are still not editable from `/admin`.
- Branches can be created/updated from `/admin`, but active/inactive controls
  still need to be wired into the main admin master-data panel.
- Category deactivation/reactivation is not implemented yet.
- Severity values are Prisma enum/system codes. Real severity editing belongs in
  the SLA policy slice, not a plain dropdown editor.
- Notification template CRUD remains a later admin master-data slice.
- Work queue filter selection currently exposes the options; backend query-param
  filtering remains a later search/work-queue behavior slice.
- Windows service `postgresql-x64-16` still owns host port 5432; keep using 5433
  for this local Docker database unless the service is stopped with admin rights.

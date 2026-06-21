# READY TO BUILD - P10-ADMIN-MASTER-DATA-B

Status: Ready to Build
Required model tier: BUILDER-STRONG
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Risk: High
SRS IDs: REQ-ADMIN-001, REQ-RBAC-001, METHOD-AUDIT-001, METHOD-API-001, METHOD-TEST-001, UI-DESIGN-001

## Context

P10-ADMIN-MASTER-DATA-A is complete. The main `/admin` route now has real
Add/Save controls for branch and complaint category master data:

- Branch Add/Save reuses the existing audited `/branches` backend CRUD.
- Category Add/Save uses new guarded `/admin/categories` create/update routes.
- Category writes are admin-only, CSRF guarded, audit logged in the same
  transaction, and documented in OpenAPI.
- The in-app browser confirmed `/admin?locale=en` has active Add/Save controls
  and zero disabled buttons.

## Scope

Build the next narrow master-data slice:

- Department create/update/deactivate/reactivate in the backend and `/admin` UI.
- Branch deactivate/reactivate controls in `/admin`.
- Preserve existing complaint/category Add/Save behavior.
- Keep severity values read-only; SLA policy editing is the next separate slice.

## Guardrails

- Do not introduce production deploy, SMTP, WhatsApp, AI, mobile, HR-platform, or
  VPS work.
- Do not hard-delete branch, department, or category rows. Use active/inactive
  toggles because these records may be referenced by complaints, users, cases,
  deals, audit logs, and history.
- Do not move authority into React. Backend owns validation, RBAC, CSRF,
  audit, branch scope, and referential safety.
- Keep the task small. If department CRUD plus branch toggles cannot stay
  focused, split before building.

## Required Proof Commands

- `corepack pnpm test:api -- admin`
- `corepack pnpm test:web -- shell`
- `corepack pnpm openapi:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test:web -- localization`
- `git diff --check`
- Live browser smoke at `http://localhost:4000/admin?locale=en`

## Notes

- Existing app runtime after P10-ADMIN-MASTER-DATA-A: API on
  `http://localhost:3000`, web on `http://localhost:4000`, Docker Postgres on
  host port `5433`, Redis on `6379`.
- Severity/SLA policy management and notification templates remain follow-up
  slices.

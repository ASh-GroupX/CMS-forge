# READY TO PLAN - P10-ADMIN-MASTER-DATA

Status: Ready to Plan
Required model tier: PLANNER-STRONG
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Risk: High
SRS IDs: REQ-ADMIN-001, REQ-RBAC-001, METHOD-AUDIT-001, METHOD-API-001, METHOD-TEST-001, UI-DESIGN-001

## Context

P10-AUTH-LOCAL, P10-DATA-LOCAL, and the P10-ADMIN-REAL admin users slice are
complete. The local app now has real staff login, DB-backed complaint options,
queue/search branch and owner names, and a real `/admin` account-management
surface with active create/deactivate/reactivate buttons.

The next local product gap is admin-controlled master data. The dealership
needs admins to maintain the operational lists that drive work intake and SLA
behavior instead of relying on seed data or developer edits.

## Scope

- Plan audited backend CRUD for the master data required by the real app:
  branches, departments, complaint categories/subcategories, severity/SLA policy,
  and notification templates.
- Preserve server-session RBAC and branch scope. Admin-only actions must be
  enforced by API guards and audited.
- Wire admin UI to real typed API clients. Remove or retire preview-only admin
  routes as each real surface lands.
- Keep task slices small; do not build a broad frontend-only admin panel.

## Guardrails

- Do not introduce SMTP, VPS, WhatsApp, AI, mobile, HR-platform, or production
  deploy work.
- Do not hard-delete master data referenced by complaints, tasks, deals, audit,
  or history rows. Use deactivate/reactivate where references can exist.
- Do not move business authority into React. Backend owns validation, state,
  RBAC, branch scope, audit, and referential safety.

## Last Proof Commands

- `corepack pnpm test:api -- admin`
- `corepack pnpm test:web -- shell`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm openapi:check`
- `corepack pnpm exec tsc -p apps/api/tsconfig.json`
- `git diff --check`

## Planner Output Required

- Split P10-ADMIN-MASTER-DATA into backend-first tasks with tests and OpenAPI
  updates.
- First recommended slice: real branch and department management, because
  branch scope is foundational for complaint intake, queues, user assignment,
  manager visibility, and KPI filters.
- Follow-up slices: complaint category/subcategory management, severity/SLA
  policy management, then notification template management.

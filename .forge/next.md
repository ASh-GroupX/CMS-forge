# READY TO PLAN - P10-ADMIN-REAL

Status: Ready to Plan
Required model tier: PLANNER-STRONG
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Risk: High
SRS IDs: REQ-ADMIN-001, REQ-RBAC-001, METHOD-AUDIT-001, METHOD-API-001, METHOD-TEST-001, UI-DESIGN-001

## Context

P10-AUTH-LOCAL and P10-DATA-LOCAL are complete. The local app now has real staff
login, no public preview sign-in shortcuts, DB-backed complaint form options,
and queue/search rows that render branch/owner names instead of raw IDs.

The next local product gap is real admin management. The current admin users,
branches, and categories screens are still frontend shells, while account
creation outside tests is only available through `corepack pnpm staff:bootstrap`.
Plan P10-ADMIN-REAL into small build tasks before implementation.

## Scope

- Design the smallest audited backend admin CRUD slice that can create/update/
  deactivate/reactivate staff users and manage the master data required by
  complaint creation.
- Preserve server-session RBAC and branch scope. Admin-only actions must be
  enforced by API guards and audited.
- Wire admin UI to real typed API clients. Remove preview-only admin affordances
  as each real surface lands.
- Keep task slices small; do not build a broad frontend-only admin panel.

## Guardrails

- Do not introduce SMTP, VPS, WhatsApp, AI, mobile, HR-platform, or production
  deploy work.
- Do not store or return plaintext passwords. Admin-created accounts need a
  deliberate password/reset-token flow, not a default password.
- Do not hard-delete master data referenced by complaints.

## Last Proof Commands

- `corepack pnpm test:api -- workflow`
- `corepack pnpm test:api -- search`
- `corepack pnpm test:web -- shell`
- `corepack pnpm openapi:check`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `git diff --check`

## Planner Output Required

- Split P10-ADMIN-REAL into backend-first tasks with tests and OpenAPI updates.
- First recommended slice: real Admin Users read/create/deactivate/reactivate,
  with roles/branches option data, audit, RBAC denial test, and web route wired
  to backend data.

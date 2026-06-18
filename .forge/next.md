# Next Task: F1-02 - RBAC and branch-scope enforcement

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 1 - Security Baseline

## Why This Exists

The auth foundation (F1-01A..E3) is verified and accepted (see trust.md
VERIFY-F1-01E). `AuthService.validateStaffSession` already returns safe,
server-derived staff claims (role + branch) but nothing resolves a session per
request yet, and no route is access-controlled. F1-02 turns those claims into
enforced authority: authenticate the request from the session cookie, then gate
routes by role and branch scope — decided on the server, never from client input.

## Scope

Enforce RBAC + branch scope using the canonical pattern in `docs/ARCHITECTURE.md`
§6.2, reusing the existing `validateStaffSession` and `AuditService`. Do not invent
a new guard, error, or audit mechanism.

- Add a core session-authentication guard that reads the `cms_staff_session` cookie,
  validates it via `AuthService.validateStaffSession`, and attaches the server-derived
  principal (claims) to the request. Unauthenticated/invalid requests to protected
  routes are denied with the stable `AUTH_INVALID_CREDENTIALS` envelope.
- Add `@Roles(...)` and `@BranchScoped()` decorators plus an `RbacGuard` that reads the
  role and branch **from the attached principal only**. Deny with stable codes
  `RBAC_FORBIDDEN` / `BRANCH_SCOPE_FORBIDDEN` and emit a `SECURITY` audit entry on deny.
- Demonstrate enforcement on one protected route (e.g. an authenticated `GET /auth/me`
  returning safe claims) — not a broad feature surface.
- Tests: at least one allowed and one denied case for role, one allowed and one denied
  case for branch scope, and one unauthenticated denial. Assert deny paths write a
  `SECURITY` audit and never trust client-supplied role/branch.

## Scope Guard

Keep to ~1–5 source files plus tests. If session-resolution + role gate + branch-scope
gate + deny-audit cannot fit that budget, **stop and replan**: rewrite this file as
`PLAN-F1-02` splitting it into (a) session-authentication guard that resolves the
principal, then (b) role/branch decorators + `RbacGuard` + deny-audit, and set
`.forge/state.md` to `Ready to Plan`. Do not ship a large diff.

## Out Of Scope

- Login rate limiting and CSRF (tracked as `F1-06`; NFR-SEC-001 AC3/AC5).
- Audit log search/export and DB-level append-only enforcement (`F1-03`).
- Full stable error-code surface (`F1-04`).
- Golden CRUD module (`F1-05`), username login, password reset, lock flows, and any UI.

## Requirement IDs

- REQ-RBAC-001
- NFR-SEC-002
- ARCH-AUTH-001
- METHOD-AUDIT-001
- METHOD-API-001
- METHOD-TEST-001
- API-STANDARD-001

## Acceptance Criteria

- Role and branch scope are resolved from the server-side session principal, never from
  client input (REQ-RBAC-001, NFR-SEC-002).
- A denied role returns `RBAC_FORBIDDEN`; a denied branch returns
  `BRANCH_SCOPE_FORBIDDEN`; both emit a `SECURITY` audit entry.
- At least one allowed and one denied case per gate is tested (role and branch scope),
  plus an unauthenticated denial.
- No secrets/tokens logged or returned; no portal data exposed.
- New/changed protected route(s) documented in OpenAPI; `openapi:check` passes.
- Required proof commands pass and actually ran.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- auth`
- `corepack pnpm openapi:check`

## Evidence To Record

This is a High-risk task: record the `policy.md` Security Self-Check in
`.forge/evidence.md` (citing where each item is enforced/tested), update
`.forge/trust.md`, mark the task in `.forge/backlog.md`, and update
`.forge/next.md` + `.forge/state.md` per the BUILD rules. F1-02 is **not** a
`Verify Gate`; on success AUTO PHASE continues to the next Phase 1 task.

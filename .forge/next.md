# Next Task: F1-06C - Enforce CSRF On Branch Admin Mutation Routes

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 1 - Security Baseline
Requirement IDs: NFR-SEC-001 (AC5), REQ-ADMIN-001, API-STANDARD-001, METHOD-AUDIT-001,
METHOD-API-001, METHOD-TEST-001, NFR-SEC-002

## Why This Exists

`F1-06B` established and verified the CSRF kernel (`CsrfGuard`, double-submit cookie,
stable `CSRF_INVALID` 403, safe `SECURITY`/`csrf_rejected` audit) and enforced it on the
session-authenticated auth mutation route (`POST /auth/logout`). The same `[must]`
requirement `NFR-SEC-001` AC5 also covers the **branch admin mutation routes**, which today
carry only `SessionAuthGuard` + `RbacGuard`. This task reuses the verified CSRF mechanism on
those routes. It is the last Phase 1 backlog item — after it, Phase 1 stops at the
`PHASE-REVIEWER` gate before Phase 2.

## Scope (keep to ~1–5 files + tests)

Reuse the existing `apps/api/src/core/csrf.guard.ts` — do **not** invent a second CSRF
mechanism.

1. `apps/api/src/modules/branches/branches.controller.ts`
   - Add `CsrfGuard` to the three mutation routes only:
     `POST /branches` (create), `PATCH /branches/:id` (update),
     `POST /branches/:id/deactivate` (deactivate).
   - Place it after `SessionAuthGuard` so the deny-path audit has the server `principal`
     (e.g. `@UseGuards(SessionAuthGuard, RbacGuard, CsrfGuard)`); keep `RbacGuard` and
     `@Roles('ADMIN')` exactly as-is.
   - Leave the read routes (`GET /branches`, `GET /branches/:idOrCode`) **unguarded by CSRF**
     — they are not mutations.
2. `apps/api/src/modules/branches/branches.module.ts`
   - Register `CsrfGuard` as a provider (its only dependency, `AuditService`, is already
     provided here).
   - Carry-forward from VERIFY-F1-06B obs. 2: this module does not currently register
     `SessionAuthGuard`/`RbacGuard`/`SESSION_AUTH_SERVICE`, yet the controller uses them.
     Make the branch routes actually resolve at runtime (register the guards + session-auth
     token, or import the module that exports them) so adding `CsrfGuard` does not ship a
     module that fails to bootstrap.
3. `tools/openapi-check.mjs`
   - Add a `403: error('Invalid CSRF token (CSRF_INVALID)')` response to the three branch
     mutation operations in the canonical document (mirror the `/auth/logout` entry).
4. `packages/contracts/openapi.json`
   - Regenerate via `corepack pnpm openapi:generate` (or `node tools/openapi-check.mjs --write`)
     so `openapi:check` stays drift-clean. (Canonical artifact — budget-exempt.)
5. Tests — `apps/api/test/admin/` (extend `branches-read.test.ts` or add `branches-csrf.test.ts`)
   - Prove the trust boundary on a branch mutation route: **one allowed** (matching CSRF
     cookie+header passes) and **one denied** (missing/mismatched token → `CSRF_INVALID` 403
     + `SECURITY`/`csrf_rejected` audit, no secret values).
   - Prove the three mutation handlers are CSRF-guarded and the read handlers are not
     (reflection/metadata assertion or a Nest bootstrap smoke test). A small bootstrap smoke
     test would also close VERIFY-F1-06B obs. 1/2; not mandatory if the wiring is otherwise
     proven.
   - Keep the existing admin suite green.

Do not add complaint/portal/SLA behavior, new error codes, or a distributed CSRF store.

## Required Checks

- Do `POST /branches`, `PATCH /branches/:id`, and `POST /branches/:id/deactivate` require
  session auth + RBAC(ADMIN) **and** a matching CSRF cookie/header?
- Do the branch **read** routes stay free of CSRF enforcement?
- Does branch CSRF denial return the same stable `CSRF_INVALID` 403 and write a safe
  `SECURITY`/`csrf_rejected` audit (no token/cookie/password/hash values)?
- Does `branches.module.ts` resolve all guards so the routes bootstrap (no DI gap)?
- Does OpenAPI document the new 403 on all three routes with `openapi:check` drift-clean?
- One allowed + one denied CSRF case tested on the branch mutation surface?
- Are all verification labels honest and actually run?

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- admin`
- `corepack pnpm test:api -- security`
- `corepack pnpm openapi:check`

`corepack pnpm security:check` stays a pending fail-loud aggregate; do not report it as passed.

## Security Self-Check (record in evidence.md — High risk)

- Roles and branch scope come from the server session, never client input.
- CSRF validation derives only from the server-issued cookie + `x-csrf-token`.
- No passwords, OTPs, tokens, hashes, or cookie values are logged or returned.
- Customer portal exposure rules: not applicable (no portal route changed).
- Trust boundaries tested: one allowed + one denied CSRF case on a branch mutation route.

## Output

On success:
- Append evidence to `.forge/evidence.md` (with the security self-check) and a trust note to
  `.forge/trust.md`.
- Mark `F1-06C` done in `.forge/backlog.md`.
- All Phase 1 backlog tasks are then complete → write the Phase 1 `PHASE-REVIEWER` task to
  `.forge/next.md` and set `.forge/state.md` to `Needs Phase Review`. Do **not** start Phase 2.

On failure:
- Append failed evidence, set `.forge/state.md` to `Blocked`, rewrite `.forge/next.md` as the
  smallest repair task, and escalate the model tier.

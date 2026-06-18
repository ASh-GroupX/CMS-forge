# Next Task: VERIFY-F1-06B - CSRF Kernel Guard Verify Gate

Status: Needs Verify
Required model tier: independent VERIFY (fresh context or different model)
Risk: High
Phase: Phase 1 - Security Baseline

## Why This Exists

`F1-06B` is marked `Verify Gate: required` because `F1-06C` will reuse the CSRF
mechanism on branch admin mutation routes. AUTO PHASE must pause here until an
independent verifier accepts the CSRF kernel and auth-route enforcement.

## Verify Scope

Review the `F1-06B` implementation and evidence:

- `apps/api/src/core/csrf.guard.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.module.ts`
- `apps/api/test/security/csrf.test.ts`
- `apps/api/test/security/rate-limit.test.ts`
- `apps/api/test/auth/http-routes.test.ts`
- `tools/api-test.mjs`
- `tools/openapi-check.mjs`
- `packages/contracts/openapi.json`
- `.forge/evidence.md`, `.forge/trust.md`, `.forge/backlog.md`, `.forge/state.md`

## Required Checks

- Did F1-06B stay inside scope?
- Does `POST /auth/logout` require session auth plus matching CSRF cookie/header?
- Is `POST /auth/login` still not CSRF-protected, but does issue a CSRF cookie?
- Does CSRF denial return stable `CSRF_INVALID` HTTP 403?
- Does CSRF denial write a safe `SECURITY` / `csrf_rejected` audit entry?
- Do tests prove one allowed and one denied CSRF trust-boundary case?
- Were verification labels honest and actually run?
- Did OpenAPI document the new stable CSRF error behavior without drift?
- Did the builder avoid logging/returning token, cookie, password, or hash values?

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- security`
- `corepack pnpm test:api -- auth`
- `corepack pnpm openapi:check`

## Output

Write a VERIFY record to `.forge/trust.md`:

- Builder honesty: Honest, Inflated, or Fabricated
- Code quality: Good, Acceptable, or Poor
- Recommendation: Accept, Repair, or Redo

On `Accept`, queue `F1-06C - Enforce CSRF On Branch Admin Mutation Routes` and set
`.forge/state.md` to `Ready to Build`. On `Repair` or `Redo`, set state to
`Needs Repair` and write the smallest repair task.

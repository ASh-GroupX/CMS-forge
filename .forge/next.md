# Next Task: F1-06A - Login Rate Limiting (Account + IP)

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 1 - Security Baseline

## Why This Exists

`NFR-SEC-001` AC3 [must]: "Login is rate limited by account and IP." It is an unbuilt,
blocking Phase 1 Security-baseline item (carry-forward from VERIFY-F1-01E). This is the
first of the F1-06 split (PLAN-F1-06); CSRF (AC5) is `F1-06B` then `F1-06C`.

## Scope

Add login rate limiting to `POST /auth/login`, keyed by client IP (always) and by the
submitted account identifier when present. On exceeding the limit, deny with HTTP 429 and
a stable error code, and write a `SECURITY` / `rate_limit_triggered` audit entry.

Allowed files (keep near 1-5 source files plus tests):

1. `apps/api/src/core/rate-limit.guard.ts` (new) - `LoginRateLimitGuard` plus a small
   in-memory fixed-window counter behind an injectable interface (so a Redis-backed store
   can replace it later). Keys: client IP (first hop of `x-forwarded-for`, else socket
   address) always, plus the normalized identifier from the already-parsed `request.body`
   when present. Window/limit are documented constants (suggest 5 attempts / 60s per key;
   builder may tune but must document). On exceed: throw
   `AppException('RATE_LIMITED', <safe message>, 429)` and emit a `SECURITY` audit entry
   via the existing `AuditService`.
2. `apps/api/src/modules/auth/auth.controller.ts` - apply
   `@UseGuards(LoginRateLimitGuard)` to the `login` handler only; do not touch logout/me.
3. `apps/api/src/modules/auth/auth.module.ts` - provide `LoginRateLimitGuard` and its
   store; reuse the existing `AuditService` provider.
4. `tools/api-test.mjs` - add `security` to `allowedSuites`.
5. `tools/openapi-check.mjs` - document the `429` response and `RATE_LIMITED` stable code
   on `POST /auth/login`; keep `openapi:check` drift-enforced.

Tests:

6. `apps/api/test/security/rate-limit.test.ts` (new) - exercise `LoginRateLimitGuard`
   directly with a fake `AuditService` and a stub execution context: one allowed case
   (under the limit -> `canActivate` returns true) and one denied case (over the limit ->
   throws `RATE_LIMITED` 429 and records a `SECURITY` / `rate_limit_triggered` audit).
   Assert the recorded audit metadata and the 429 body contain no password, token, or hash.

## Out Of Scope

- CSRF protection (`F1-06B`, `F1-06C`).
- Account lockout / `lockedAt` changes (REQ-AUTH-001 AC5) - separate feature.
- Distributed/Redis-backed rate limiting - in-memory MVP store only; record the deferral
  as an assumption in evidence.
- Implementing the aggregate `security:check` script - it stays a pending fail-loud proof.
  Do not report it as passed.
- Changing branch, audit, RBAC, or session source code beyond wiring the new guard.

## Requirement IDs

- NFR-SEC-001 (AC3)
- REQ-AUTH-001
- API-STANDARD-001
- METHOD-AUDIT-001
- METHOD-API-001
- METHOD-TEST-001
- NFR-SEC-002

## Acceptance Criteria

- `POST /auth/login` is rate limited by account + IP; over-limit requests get HTTP 429
  with the stable `RATE_LIMITED` code, documented in OpenAPI (API-STANDARD-001 AC1).
- A `SECURITY` audit entry with action `rate_limit_triggered` is written on a trip,
  carrying IP / correlationId / userAgent and no secret values.
- Rate-limit keys derive from server-observed IP and the submitted identifier only - never
  from client-controlled limit/threshold input.
- Existing auth behavior is preserved: a legitimate login under the limit still works
  (`test:api -- auth` stays green).
- New file(s) stay under the 300-line budget; the `auth` `MODULE.md` stays manifest-valid.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- security`
- `corepack pnpm test:api -- auth`
- `corepack pnpm openapi:check`

## Security Self-Check (required - High risk)

Record each in `.forge/evidence.md`, citing where enforced/tested:

- Roles/branch scope from server session: N/A for pre-session login; confirm the guard
  derives throttle keys from server-observed IP + submitted identifier, never from
  client-supplied limit fields.
- State change + audit in same transaction: the rate-limit trip is not a domain state
  change; the `SECURITY` audit is a standalone append-only write (consistent with the
  existing `login_failure` write). State this explicitly.
- No passwords, OTPs, tokens, hashes, or secrets logged or returned: assert the audit
  metadata and 429 body contain none; the new test must check this.
- Customer portal exposure rules: N/A; no portal surface touched.
- Trust boundaries tested: one allowed (under limit) and one denied (over limit -> 429 +
  `rate_limit_triggered` audit).

## Evidence To Record

Append `F1-06A - Login Rate Limiting (Account + IP)` to `.forge/evidence.md` with honest
labels and the security self-check. Update `.forge/trust.md` with risk + recommendation,
mark `F1-06A` done in `.forge/backlog.md`, then queue `F1-06B` in `.forge/next.md` and set
`.forge/state.md` to `Ready to Build`.

## Next After Completion

`F1-06B - CSRF Kernel Guard, Token Issuance, And Auth-Route Enforcement`
(Verify Gate: required). AUTO PHASE may continue to the `F1-06B` build, but must stop at
`Needs Verify` after it for an independent VERIFY before `F1-06C`.

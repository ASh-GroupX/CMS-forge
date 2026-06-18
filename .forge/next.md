# Next Task: F1-01E1 - Auth HTTP Login/Logout Routes

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 1 - Security Baseline

## Why This Exists

The auth service can verify credentials, create staff sessions, validate sessions,
and revoke sessions, but the API has no staff login/logout HTTP routes yet.
Add only the route layer and Nest module wiring. Audit and OpenAPI are separate
follow-up tasks so the final auth gate stays small.

## Scope

Implement staff auth HTTP route wiring only:

- Add `AuthModule` and `AuthController` for `POST /auth/login` and
  `POST /auth/logout`.
- Wire `AuthModule` into the existing Nest app.
- Use existing `AuthService.verifyCredentials`, `createStaffSession`, and
  `logoutStaffSession`; do not redesign credential or session behavior.
- Validate malformed login bodies and return the standard error envelope.
- Set the staff session `Set-Cookie` header on login and the expired cookie on
  logout.
- Return only safe staff claims and session expiry. Never return raw session
  tokens, password hashes, OTPs, or credentials.
- Add focused auth API tests for successful login cookie issuance, generic failed
  login, logout expired cookie, and malformed input.

## Out Of Scope

- Audit entries for login success, login failure, and logout. That is `F1-01E2`.
- OpenAPI path/schema updates and final auth security proof. That is `F1-01E3`.
- CSRF, rate limiting, password reset, RBAC guards, UI login page, or external SSO.

## Expected Application Files

- `apps/api/src/main.ts`
- `apps/api/src/modules/auth/auth.module.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/dto/login-request.dto.ts`
- `apps/api/test/auth/http-routes.test.ts`

## Requirement IDs

- CONTRACT-READINESS-002
- ARCH-AUTH-001
- REQ-AUTH-001
- REQ-AUDIT-001
- NFR-SEC-001
- METHOD-API-001
- METHOD-AUDIT-001
- METHOD-TEST-001
- API-STANDARD-001

## Acceptance Criteria

- `POST /auth/login` succeeds for a valid active staff user and sets an HttpOnly
  staff session cookie.
- Failed login returns a generic auth error and does not reveal whether identifier
  or password failed.
- `POST /auth/logout` invalidates the active session via the existing auth service
  and returns an expired staff session cookie.
- Malformed login input returns the standard error envelope.
- Responses never include password hashes, raw session tokens, OTPs, or secrets.
- New app/package/tool source files stay under the 300-line agentic budget.
- The final auth foundation gate remains `F1-01E3`.

## Verification Commands

- `corepack pnpm install --lockfile-only` (only if package dependencies change)
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- auth`
- `corepack pnpm openapi:check`

## Evidence To Record

Append `F1-01E1 - Auth HTTP Login/Logout Routes` to `.forge/evidence.md` with
honest labels and the High-risk security self-check from `.forge/policy.md`.

## Next Step On Success

Mark `F1-01E1` done in `.forge/backlog.md`, write `F1-01E2 - Auth Audit Entries`
to `.forge/next.md`, and keep `.forge/state.md` as `Ready to Build`.

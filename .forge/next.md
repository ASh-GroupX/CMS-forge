# Next Task

## F1-01 - Staff Auth With Argon2id And HttpOnly Sessions

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High

## Requirement IDs

- CONTRACT-READINESS-002
- ARCH-AUTH-001
- REQ-AUTH-001
- API-STANDARD-001
- METHOD-AUDIT-001
- METHOD-API-001
- METHOD-TEST-001
- NFR-SEC-001

## Scope

Add the smallest staff authentication baseline:

1. Use the module generator to create the `auth` module skeleton if it does not exist.
2. Add password hash/verify helpers using Argon2id through an already-approved dependency.
3. Add a minimal session shape suitable for HttpOnly cookie issuance; do not trust client roles.
4. Add login/logout service behavior for active staff users only, with generic failed-login errors.
5. Add focused tests for valid login, invalid password, and inactive/locked user rejection.
6. Add/update OpenAPI scaffold only for auth routes if a controller route is introduced.

## Expected Files

- `apps/api/src/modules/auth/**`
- `apps/api/package.json` or root package files only if needed for Argon2 dependency wiring
- `packages/contracts/openapi.json` only if auth routes are exposed
- `tools/*.test.mjs` only if needed to keep current scaffold checks honest

Do not implement RBAC/branch-scope policy beyond loading role/branch from the server-side user record. Do not add UI login screens, password reset, CSRF, rate limiting, or full audit persistence in this task; those are later Phase 1 tasks unless needed to keep tests honest.

## Acceptance Criteria

- Password hashing uses Argon2id, not plaintext or reversible storage.
- Login succeeds only for a valid active staff user.
- Invalid credentials, inactive users, and locked users are rejected with generic safe errors.
- Session data is server-derived and includes user id, role, and branch scope from storage, not client input.
- Existing lint, typecheck, test coverage, OpenAPI check, and build gates still pass.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm openapi:check`
- `corepack pnpm build`

## Evidence To Record

Append `F1-01 - Staff Auth With Argon2id And HttpOnly Sessions` to `.forge/evidence.md` with honest Passed/Failed labels and cite the requirement IDs above.
Update `.forge/trust.md`, mark `F1-01` done in `.forge/backlog.md` only if all verification commands pass, and write the next task before finishing.

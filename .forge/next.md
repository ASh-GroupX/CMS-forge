# Next Task: F1-01A - Auth Data Foundation And API Test Harness

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High

## Why This Exists

The broad staff auth task was split before coding. Before login/session behavior
is added, seeded staff users need usable Argon2id password hashes and
`test:api -- auth` must become a real, focused proof path instead of a pending
placeholder.

This is a foundation task only. Do not add auth routes, cookies, sessions, audit
writes, RBAC, frontend login UI, or OpenAPI auth paths here.

## Scope

Implement the smallest auth data/test foundation:

1. Give the existing dev-only seeded staff users non-null Argon2id password hashes.
2. Add a minimal API test runner so `corepack pnpm test:api -- auth` runs auth
   API tests and unknown suites still fail loudly.
3. Add one focused auth test proving the seeded staff password hashes are present,
   Argon2id-shaped, and no plaintext password field is seeded.

Keep the change near 1 to 5 files plus tests. Do not generate the `auth` module
yet unless the builder can prove the generated diff still fits this task.

## Requirement IDs

- CONTRACT-READINESS-002
- ARCH-AUTH-001
- REQ-AUTH-001
- NFR-SEC-001
- METHOD-TEST-001

## Expected Files

- `package.json`
- `tools/api-test.mjs`
- `apps/api/test/auth/password-hash.test.ts`
- `packages/database/prisma/seed.ts`
- `pnpm-lock.yaml` only if dependencies change

## Acceptance Criteria

- Seeded staff users have non-null Argon2id password hashes.
- Seed data still contains no plaintext password fields.
- `corepack pnpm test:api -- auth` runs a real auth test instead of
  `pending-proof.mjs`.
- Unknown or missing API test suites fail loudly.
- No login endpoint, session cookie, logout behavior, audit write, OpenAPI path,
  RBAC guard, or UI is implemented in this task.
- Evidence includes the High-risk security self-check from `.forge/policy.md`,
  with non-applicable items labeled honestly.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- auth`
- `corepack pnpm openapi:check`

## Evidence To Record

Append `F1-01A - Auth Data Foundation And API Test Harness` to
`.forge/evidence.md` with honest labels and the security self-check.

## Next After Completion

If checks pass, write `F1-01B - Auth Module Credential Verification With
Argon2id And Generic Denial` to `.forge/next.md` and keep `.forge/state.md` as
`Ready to Build`.

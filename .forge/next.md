# Build Task: F6-01D1 - Add Backend Password Reset Request Token Foundation

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 6 - Staff UI

## Scope

Build the smallest backend prerequisite for the mandatory staff password reset
screen before any UI contract is added.

Implement password reset request token persistence and generic request service
behavior inside the existing `auth` module.

## Do

- Update the auth module manifest to include the password-reset token table.
- Add Prisma schema and SQL migration support for staff password reset tokens:
  user relation, token hash only, expiry timestamp, consumed/used timestamp, and
  query indexes needed for token lookup/cleanup.
- Add auth repository/service behavior for requesting a reset:
  - normalize the identifier the same way login does;
  - return the same generic result for missing, inactive, locked, and active
    users;
  - store only a hash of any generated token;
  - set a short time-limited expiry;
  - write an `AUTH` audit entry for active-user reset requests without logging
    the raw token, token hash, password, or credential material.
- Add focused `test:api -- auth` coverage for generic request behavior,
  hash-only storage, safe audit metadata, and no user-existence oracle.

## Do Not

- Do not add HTTP routes or OpenAPI paths yet; that is `F6-01D3`.
- Do not add reset-token consume/password-change behavior yet; that is
  `F6-01D2`.
- Do not add email/SMS delivery, provider calls, frontend UI, token storage in
  the browser, or admin reset UI.
- Do not expose raw tokens in persisted rows, logs, audit metadata, API
  responses, or test snapshots. If a raw token must leave a service method for a
  future server-side delivery boundary, keep that return path explicit and prove
  it is not persisted or audited.
- Do not let `auth.service.ts` exceed the 300-line source budget. Use a small
  internal auth helper or stop and replan if the slice cannot stay inside the
  budget.

## Requirement IDs

- REQ-AUTH-001
- UI-SCREEN-001
- METHOD-AUDIT-001
- METHOD-TEST-001

## Acceptance Criteria

- A reset request for an existing active staff user creates exactly one
  time-limited token record with only a hashed token value.
- Missing, inactive, and locked users receive the same generic service result as
  active users and do not reveal account state.
- Safe `AUTH` audit is recorded for real reset requests; audit/log/test output
  does not contain passwords, raw reset tokens, or token hashes.
- The new schema validates and stays within the auth module boundary.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- auth`
- `corepack pnpm prisma:validate`
- `corepack pnpm openapi:check`
- `git diff --check`

## Evidence Required

Because this is High risk auth work, `.forge/evidence.md` must include the
security self-check from `.forge/policy.md`.

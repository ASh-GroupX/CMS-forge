# Next Task: F1-03C - Audit Append-Only Enforcement Proof

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 1 - Security Baseline

## Why This Exists

Audit search and export now use application-level append-only writes and Admin-only
read/export access. The remaining `F1-03` item is database-level proof that audit rows
cannot be updated or deleted by ordinary application flows.

## Scope

Add the smallest database-backed append-only enforcement proof for `audit_logs`.

- Add a Prisma migration SQL guard that prevents `UPDATE` and `DELETE` on `audit_logs`
  at the database level. Prefer a tiny Postgres trigger/function that raises an error
  before update/delete; do not refactor the Prisma schema or audit service.
- Add one focused proof in the existing audit API test suite or a small script-backed
  check showing audit insert still works but update/delete is blocked.
- Keep `AuditService.record` create-only; do not add update/delete APIs.
- Stay inside 1-5 files plus focused tests.

## Out Of Scope

- New audit search/export features.
- Retention deletion/anonymization policy.
- Management Read-Only configurable audit access.
- General database hardening outside `audit_logs`.

## Requirement IDs

- REQ-AUDIT-001
- ARCH-DATA-001
- METHOD-AUDIT-001
- METHOD-TEST-001

## Acceptance Criteria

- Audit rows remain insertable through the existing append-only audit writer.
- Database-level `UPDATE` and `DELETE` against `audit_logs` are rejected.
- The proof command actually exercises the guard, not only static SQL inspection.
- Required checks pass and source files remain under the 300-line budget.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- audit`
- `corepack pnpm openapi:check`

If a live database proof is needed, run it inside the Docker network as documented in
`.forge/state.md`; do not claim it passed unless it actually ran.

## Evidence To Record

This is a High-risk task: record the `policy.md` Security Self-Check in
`.forge/evidence.md`, update `.forge/trust.md`, mark `F1-03C` done in
`.forge/backlog.md`, and update `.forge/next.md` + `.forge/state.md` per BUILD rules.

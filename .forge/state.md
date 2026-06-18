# Current State

Status: Ready to Plan
Phase: Phase 1 - Security Baseline
Next Task: PLAN-F1-03 - Split Audit Search/Export And Append-Only Enforcement

## Phase 1 — Auth Foundation Verified (gate passed)

VERIFY-F1-01E decision: **Accept** (independent VERIFY, fresh context / Opus 4.8,
2026-06-18). Builder honesty Honest, code quality Good. All five proof commands
independently re-run green (lint, typecheck, test 19/19, test:api -- auth 15/15,
openapi:check); change scope clean; no secret/token exposure, missing audit, or
OpenAPI drift. Full record in `.forge/trust.md` (VERIFY-F1-01E). The `Verify Gate`
on `F1-01E3` is cleared — AUTO PHASE may resume from `F1-02`.

### Carry-forward conditions into the rest of Phase 1 (see trust.md VERIFY-F1-01E)

1. Login rate limiting (NFR-SEC-001 AC3) and CSRF on session-authenticated mutation
   routes (NFR-SEC-001 AC5) are unbuilt `[must]` items and blocking at the MVP
   "Security baseline" gate. Tracked as new backlog item `F1-06`; must land before the
   Phase 1 PHASE-REVIEWER gate.
2. Username login (REQ-AUTH-001 AC1) is email-only until the users/admin model adds a
   username column; `identifier` naming is already forward-compatible.
3. Lock (REQ-AUTH-001 AC5) and password-reset (AC6) audit/flows land with those
   features; login/logout/failure auditing is complete.
4. Audit append-only is application-level only; DB-level UPDATE/DELETE revocation is
   F1-03's job.

## Phase 0 — Accepted

PHASE-0-REVIEW decision: **Accept Phase** (PHASE-REVIEWER, Opus 4.8, 2026-06-18).
All nine Phase 0 tasks done with honest, independently-reproduced evidence. Full
record in `.forge/trust.md`. Phase 1 is cleared to start.

Independently re-run and passing: lint, typecheck, test (15/15, coverage clears
thresholds), openapi:check, build, prisma validate.

## Carry-forward conditions into Phase 1 (see trust.md PHASE-0-REVIEW)

1. F1-00A must generate a Prisma migration from the F0-08 schema (committed migration
   only covers the minimal F0-04 model). Run migrations inside the Docker network on Windows.
2. No NestJS runtime yet — `apps/api` is a `node:http` liveness server. F1-00B must stand
   up the Nest app + core kernel (prisma, errors, audit, correlation). Escalate to PLANNER
   to split if scope exceeds 1–5 files.
3. Module generator emits plain TS classes, not Nest decorators — re-align at F1-05 golden CRUD.
4. `POSTGRES_HOST_AUTH_METHOD: trust` is dev-only; parameterize before any non-dev deploy.
5. Visual/a11y/perf gates stay honest fail-loud until Phase 6 screens exist.

## History

- F0-00 — agent rulebook + architecture blueprint wired into Forge.
- F0-01 — pnpm workspace scaffold, package boundaries, OpenAPI shell, Prisma shell, postgres/redis compose.
- F0-02 — real lint/typecheck/test/build/OpenAPI gates.
- F0-03 — Docker Compose all four services; images built.
- F0-04 — minimal Prisma schema + SRS-aligned enums; idempotent seed verified against live postgres; init migration committed.
- F0-05 — design tokens, Tailwind config, shadcn/ui foundation in apps/web.
- F0-06 — boundary lint, coverage thresholds, OpenAPI scaffold drift, fail-loud UI/perf proofs.
- F0-07 — dependency-free module generator; `branches` reserved as future golden CRUD.
- F0-08 — coherent MVP data model: complaint history, audit, SLA, portal verification/session, comments, attachments, approvals, notifications, surveys, compensation.
- F1-00A — generated + applied the F0-08 Prisma migration inside the Docker network; seed data preserved.
- F1-00B — bootstrapped NestJS app + core kernel (Prisma lifecycle, correlation, error envelope); liveness preserved.
- F1-01A — dev-only Argon2id staff seed hashes; real `test:api -- auth` runner replacing the placeholder.
- F1-01B — service credential verification (Argon2id), generic denial of wrong/inactive/locked/missing-hash.
- F1-01C — `StaffSession` model + migration; session creation stores only a SHA-256 token hash; HttpOnly/SameSite/Secure cookie.
- F1-01D — session validation + logout invalidation by token hash; generic denial of missing/unknown/expired/revoked.
- F1-01E1 — `AuthModule` + `POST /auth/login` and `/auth/logout` routes with DTO parsing.
- F1-01E2 — append-only `AuditService`; AUTH login_success/login_failure/logout entries; audit-in-transaction for state changes.
- F1-01E3 — auth OpenAPI contract (paths + safe schemas + Set-Cookie); `openapi:check` hardened against auth-path/schema removal.
- VERIFY-F1-01E — independent gate Accept (Honest/Good); five proof commands re-run green; carry-forward security conditions recorded.
- Known limitation: Prisma's Rust engine cannot connect through Docker Desktop's Windows port-forwarding (P1000); run DB ops inside the Docker network. Does not affect application code.

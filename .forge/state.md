# Current State

Status: Needs Phase Review
Phase: Phase 1 - Security Baseline
Next Task: PHASE-1-REVIEW - Security Baseline Acceptance Gate

## Phase 1 — CSRF Kernel Gate Passed (VERIFY-F1-06B, gate cleared)

VERIFY-F1-06B decision: **Accept** (independent VERIFY, fresh context / Opus 4.8,
2026-06-18). Builder honesty Honest, code quality Good. All six proof commands
independently re-run green (lint, typecheck, test 20/20, test:api -- security 4/4,
test:api -- auth 21/21, openapi:check). CSRF kernel + auth-route enforcement confirmed:
`POST /auth/logout` requires session auth + matching double-submit CSRF cookie/header;
`POST /auth/login` issues a readable CSRF cookie but is not CSRF-gated (rate-limited
instead); denial is stable `CSRF_INVALID` 403 with a safe `SECURITY`/`csrf_rejected`
audit and no secret exposure; OpenAPI documents it drift-free. Full record in
`.forge/trust.md` (VERIFY-F1-06B). The `Verify Gate` on `F1-06B` is cleared — AUTO PHASE
may resume from `F1-06C`.

### Carry-forward into F1-06C (see trust.md VERIFY-F1-06B observations)

1. `branches.module.ts` does not register `SessionAuthGuard`/`RbacGuard`/`SESSION_AUTH_SERVICE`
   though the branches controller uses them, and no test boots Nest to prove resolution.
   F1-06C edits this module to add `CsrfGuard` (needs only the provided `AuditService`); the
   builder should register the guard there and confirm the branch mutation routes bootstrap.
2. Guard wiring across the app is inspection-verified, not e2e-tested (all API tests are
   unit-level). A small Nest bootstrap smoke test would close this; flag for the Phase 1
   PHASE-REVIEWER if not added in F1-06C.

After `F1-06C`, all Phase 1 backlog tasks are done → `Needs Phase Review` before Phase 2.

## Phase 1 — F1-06 Split (PLAN-F1-06, 2026-06-18)

`F1-06` (login rate limiting + CSRF) was split into three ordered BUILDER-STRONG build
tasks because the two protections touch different trust boundaries and the combined
surface exceeds the 1–5 file budget:

- `F1-06A` — login rate limiting by account + IP on `POST /auth/login` (NFR-SEC-001 AC3).
  Queued now; self-contained, nothing builds on it.
- `F1-06B` — CSRF kernel guard + token issuance + enforcement on auth mutation routes
  (`POST /auth/logout`) (NFR-SEC-001 AC5). **Verify Gate: required** — `F1-06C` builds
  directly on this CSRF mechanism, so AUTO PHASE pauses for an independent VERIFY here.
- `F1-06C` — enforce the same CSRF guard on branch (admin) mutation routes + OpenAPI +
  admin test fixups (NFR-SEC-001 AC5).

CSRF mutation surface mapped to `POST /auth/logout`, `POST /branches`, `PATCH /branches/:id`,
`POST /branches/:id/deactivate`. `POST /auth/login` is pre-session → covered by rate
limiting (AC3), not CSRF (AC5). After `F1-06C`, all Phase 1 backlog tasks are done →
`Needs Phase Review` before Phase 2.

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
- VERIFY-F1-03A — independent gate Repair (Honest/Acceptable); proof commands re-run green, but audit search currently allows Branch Manager despite `RBAC-MATRIX-001` marking audit-log view as Admin yes / Branch Manager no.
- REPAIR-F1-03A — audit search restricted to Admin-only; proof commands passed; queued independent repair VERIFY before `F1-03B`.
- VERIFY-F1-03A-REPAIR — independent gate Accept (Honest/Good); `GET /audit/logs` confirmed Admin-only per RBAC-MATRIX-001 (Branch Manager denied + SECURITY-audited, service fails closed); filtering/clamp/redaction/OpenAPI intact; five proof commands re-run green. Audit search gate cleared.
- F1-03B — Admin-only audit export added with row cap, redacted JSON attachment, export audit entry, OpenAPI contract, and focused audit tests.
- F1-03C — DB-level trigger prevents audit log update/delete; `test:api -- audit` applies migrations in Docker and proves insert succeeds while update/delete fail.
- F1-04 — stable API error envelope now supports optional validation field errors; auth/RBAC errors remain safe and correlation IDs propagate to headers and error bodies.
- PLAN-F1-05 — split golden CRUD work; first build task is generator alignment before creating the `branches` exemplar.
- F1-05A - generator now emits NestJS-shaped module skeletons with module/controller/service/repository decorators and manifest-valid `MODULE.md` files.
- F1-05B - generated the real `branches` module shell and filled its `MODULE.md`; CRUD behavior remains unbuilt.
- F1-05C - added branch read/list service and repository behavior with a real `test:api -- admin` suite.
- F1-05D - added Admin-only branch read/list HTTP endpoints and OpenAPI contract entries.
- F1-05E - added branch create/update/deactivate service behavior with same-transaction CONFIG audit entries.
- F1-05F - added Admin-only branch write endpoints, OpenAPI write contract entries, route tests, and froze `branches` as the golden CRUD reference.
- Known limitation: Prisma's Rust engine cannot connect through Docker Desktop's Windows port-forwarding (P1000); run DB ops inside the Docker network. Does not affect application code.

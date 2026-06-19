# Current State

Status: Needs Verify
Phase: Phase 3 - SLA And Workflow Operations
Next Task: VERIFY-F3-02A-REPAIR - SLA Warning Job Repair Gate

## REPAIR-F3-02A Built - Verify Gate

`REPAIR-F3-02A` fixed the SLA warning-job verify findings. Warning-event creation
now uses the unique idempotency key through `createMany` with duplicate skipping,
so `runWarningJob` counts only newly inserted warnings as `created`; duplicate
retries are `skipped`. The warning job now also skips invalid stored policy
duration and warning percent values before writing.

Required proof passed: lint, typecheck, test 20/20, test:api -- sla 13/13, and
openapi:check.

AUTO PHASE stops here because this repair returns to the `F3-02A` Verify Gate.

## VERIFY-F3-02A Repair Required

Independent VERIFY re-ran the required proof surface successfully: lint,
typecheck, test 20/20, test:api -- sla 12/12, and openapi:check.

Decision: Repair. `SlaService.runWarningJob` reports duplicate warning retries as
newly created because it increments `created` after every idempotent warning upsert.
The build evidence also claims malformed records are safely skipped, but the focused
test only covers a null deadline and the job does not explicitly fail closed for
invalid stored policy duration or warning percent values.

Repair `F3-02A` before `F3-02B` builds breach-job behavior on this pattern.

## F3-02A Built - Verify Gate

`F3-02A` added backend SLA warning-job behavior. `SlaRepository` now reads recorded
`DEADLINE_SET` events with stored policy duration/warning percent data and upserts
one `SlaEventType.WARNING` event by deterministic warning idempotency key.
`SlaService.runWarningJob` computes configured warning thresholds, skips malformed
or not-due records, and returns scanned/created/skipped counts plus warning keys.

Required proof passed: lint, typecheck, test 20/20, test:api -- sla 12/12, and
openapi:check.

AUTO PHASE stops here because `F3-02A` is marked `Verify Gate: required`.

## VERIFY-F3-01C Accepted - Gate Cleared

Independent VERIFY accepted `F3-01C`. `SlaRepository.createDeadlineEvent` persists
`DEADLINE_SET` events through an idempotent upsert keyed by `idempotencyKey`.
`SlaService.recordDeadlineEvent` resolves the active policy, calculates the due
timestamp, derives a deterministic key from complaint ID, stage, policy ID, and
entered timestamp, and writes one deadline event. Missing policy fails closed before
event creation.

Verification re-ran and passed: lint, typecheck, test 20/20, test:api -- sla 9/9,
and openapi:check. Phase 3 continues with `F3-02A`.

## F3-01C Built - Verify Gate

`F3-01C` added backend SLA deadline-event recording. `SlaService.recordDeadlineEvent`
resolves the active policy, calculates the due timestamp, derives a deterministic
idempotency key from complaint ID, stage, policy ID, and entered timestamp, and
persists one `DEADLINE_SET` event through `SlaRepository.createDeadlineEvent`.
Duplicate retry requests use the same idempotency key.

Required proof passed: lint, typecheck, test 20/20, test:api -- sla 9/9, and
openapi:check.

AUTO PHASE stops here because `F3-01C` is marked `Verify Gate: required`.

## VERIFY-F3-01B Accepted - Gate Cleared

Independent VERIFY accepted `F3-01B`. `SlaRepository.findActiveBySeverityAndStage`
reads active policies only, `SlaService.resolvePolicy` uses stored policy records
with nullable-or-equal branch/department/category scope matching, most-specific
selection, and newest `updatedAt` tie-breaking. Inactive or missing policies fail
closed with `SLA_POLICY_MISSING`.

Verification re-ran and passed: lint, typecheck, test 20/20, test:api -- sla 6/6,
and openapi:check. Phase 3 continues with `F3-01C`.

## F3-01B Built - Verify Gate

`F3-01B` added active stored-policy reads and backend SLA policy resolution by
severity, stage, and optional branch/department/category scope. The resolver uses
nullable-or-equal scope matching, most-specific policy selection, newest
`updatedAt` tie-breaking, and stable `SLA_POLICY_MISSING` for inactive or missing
matches.

Required proof passed: lint, typecheck, test 20/20, test:api -- sla 6/6, and
openapi:check.

AUTO PHASE stops here because `F3-01B` is marked `Verify Gate: required`.

## VERIFY-F3-01A Accepted - Gate Cleared

Independent VERIFY accepted `F3-01A`. The generated `sla` module boundary is
intact, `SlaService.calculateDeadline` is backend-owned and deterministic for
stored `ALWAYS_ON` policy input, invalid or unsupported policy input fails closed
with `SLA_POLICY_MISSING`, and no repository writes, jobs, routes, OpenAPI paths,
UI, portal exposure, provider calls, or side effects were introduced.

Verification re-ran and passed: lint, typecheck, test 20/20, test:api -- sla 3/3,
and openapi:check. Phase 3 continues with `F3-01B`.

## F3-01A Built - Verify Gate

`F3-01A` generated the SLA module and added deterministic backend deadline
calculation for stored `ALWAYS_ON` policy input. The calculator validates
severity, stage, duration, warning percent, branch timezone, calendar mode, and
entered timestamp, returns ISO `warningAt` and `dueAt`, and fails closed with
`SLA_POLICY_MISSING` for invalid or unsupported policy input.

Required proof passed: lint, typecheck, test 20/20, test:api -- sla 3/3, and
openapi:check.

AUTO PHASE stops here because `F3-01A` is marked `Verify Gate: required`.

## Previous State Before F3-01A

Status: Ready to Build
Phase: Phase 3 - SLA And Workflow Operations
Next Task: F3-01A - Generate SLA Module And Deadline Calculator

## PLAN-F3-01 Complete - Ready To Build

PLAN-F3-01 split Phase 3 into buildable SLA/workflow operations work. The first
task is the SLA module boundary plus deterministic backend deadline calculation,
marked `Verify Gate: required` because warning jobs, breach jobs, escalation, and
reopen/reassignment recalculation build directly on it.

## Phase 2 Accepted With Conditions - Ready To Plan Phase 3

PHASE-2-REVIEW accepted Complaint Core after the branch-scope and transition
role-denial audit repairs. Required proof re-ran and passed: lint, typecheck,
test 20/20, test:api -- workflow 27/27, and openapi:check.

Phase 3 may start with one non-blocking carry-forward: first-response reporting
must later either compute from the first public staff comment timestamp or
materialize `Complaint.firstResponseAt` before reporting depends on it.

## REPAIR-PHASE-2-TRANSITION-ROLE-DENIAL-AUDIT Built - Needs Phase Review

The transition role-denial audit repair is built. Valid state/action transitions
denied because of actor role now write a `SECURITY` / `workflow_role_forbidden`
audit event before returning `RBAC_FORBIDDEN`, and still reject before status
update, status history, or WORKFLOW audit writes.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 27/27,
and openapi:check.

Phase 2 is back at the mandatory PHASE-REVIEWER gate before Phase 3 planning.

## PHASE-2-REVIEW Repair Required After Branch-Scope Repair

PHASE-2-REVIEW re-ran the required proof surface successfully after
`REPAIR-PHASE-2-TRANSITION-BRANCH-SCOPE`: lint, typecheck, test 20/20,
test:api -- workflow 27/27, and openapi:check.

Decision: Repair Required. Transition-specific role denials inside
`ComplaintsService.validateTransition` throw `RBAC_FORBIDDEN` before a transaction,
but do not write the `SECURITY` audit event required by `REQ-RBAC-001` AC5 and
`WORKFLOW-MATRIX-001` AC2. Repair this before Phase 3 planning.

## REPAIR-PHASE-2-TRANSITION-BRANCH-SCOPE Built - Needs Phase Review

The Phase 2 transition branch-scope repair is built. `POST /complaints/:id/transitions`
now verifies scoped complaint detail before applying a transition, so hidden complaint
IDs reject before status update, status history, or WORKFLOW audit writes.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 27/27,
and openapi:check.

Phase 2 is back at the mandatory PHASE-REVIEWER gate before Phase 3 planning.

## PHASE-2-REVIEW Repair Required

PHASE-2-REVIEW re-ran the required proof surface successfully: lint, typecheck,
test 20/20, test:api -- workflow 25/25, and openapi:check.

Decision: Repair Required. `POST /complaints/:id/transitions` uses guard metadata
and the query `branchId`, but does not prove the target complaint belongs to that
scoped branch before `ComplaintsService.applyTransition` updates status and writes
workflow history/audit. Queue/detail/comment paths are scoped; transition must get
the same target-complaint branch protection before Phase 3 starts.

## Phase 2 Build Complete - Needs Phase Review

`F2-04C` added guarded staff HTTP comment routes and OpenAPI contract entries:
`POST /complaints/:id/comments` and `GET /complaints/:id/comments/public`.
The controller validates DTOs, derives actor and branch authority from the server
session/guards, verifies scoped complaint access before delegating, and preserves
public-comment privacy.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 25/25,
and openapi:check.

All Phase 2 backlog tasks are complete. AUTO PHASE stops here for the mandatory
Phase 2 PHASE-REVIEWER gate.

## F2-04B Built - AUTO PHASE Continuing

`F2-04B` added complaint comment service behavior: blank comment validation, internal
or public visibility, same-transaction COMMENT audit, and public-only comment reads.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 22/22,
and openapi:check.

AUTO PHASE remains in Phase 2 and continues with `F2-04C`.

## F2-04A Built - AUTO PHASE Continuing

`F2-04A` added branch-scoped complaint detail reads through `GET /complaints/:id`.
Repository/service return explicit detail objects with status-history timeline and
stable `COMPLAINT_NOT_FOUND` for missing or branch-hidden complaints.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 20/20,
and openapi:check.

AUTO PHASE remains in Phase 2 and continues with `F2-04B`.

## F2-03C Built - AUTO PHASE Continuing

`F2-03C` added branch-scoped staff queue reads through `GET /complaints`.
Repository/service return explicit queue objects, and the controller derives queue
branch scope from the guarded query target or the server principal for non-admin
staff.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 18/18,
and openapi:check.

AUTO PHASE remains in Phase 2 and continues with `F2-04A`.

## F2-03B Built - AUTO PHASE Continuing

`F2-03B` added `POST /complaints` as a guarded staff complaint creation route. The
controller validates the request body, requires a guarded `branchId` query target,
ignores spoofed body branch/actor data, derives actor context from the server
request principal, and delegates to `ComplaintsService.createInternal`.

Required proof passed after one honest repair loop: `typecheck` initially failed
because nullable context fields could be `undefined`; the create DTO mapper now
normalizes them to `null`. Final proof passed: lint, typecheck, test 20/20,
test:api -- workflow 16/16, and openapi:check.

AUTO PHASE remains in Phase 2 and continues with `F2-03C`.

## F2-03A Built - AUTO PHASE Continuing

`F2-03A` added `ComplaintsService.createInternal` with required-field validation,
VIN-required-when-vehicle-related validation, count-based deterministic reference
generation, complaint persistence, initial submitted status history, and COMPLAINT
audit in one transaction.

Required proof passed after one honest repair loop: `typecheck` initially failed on
Prisma relation input shape and nullable history actor role; the repository now
upserts the minimal customer then creates the complaint by `customerId`, and creation
history allows `actorRole: null`. Final proof passed: lint, typecheck, test 20/20,
test:api -- workflow 13/13, and openapi:check.

AUTO PHASE remains in Phase 2 and continues with `F2-03B`.

## F2-02C Built - AUTO PHASE Continuing

`F2-02C` added `POST /complaints/:id/transitions` as a guarded staff workflow route.
The controller validates request shape, derives actor role/ID/audit context from the
server request principal, forces `STAFF_API` request source, and delegates to
`ComplaintsService.applyTransition`.

Required proof passed after two honest repair loops: the first workflow run failed
on a test expectation for existing branch-scope audit metadata, and the first lint
run failed because `tools/openapi-check.mjs` exceeded the 300-line budget. Both were
fixed. Final proof passed: lint, typecheck, test 20/20, test:api -- workflow 11/11,
and openapi:check.

AUTO PHASE remains in Phase 2 and continues with `F2-03A`.

## VERIFY-F2-02B-REPAIR Accepted

Independent VERIFY accepted the `REPAIR-F2-02B` fix. The repair stayed inside the
scoped service/repository/workflow-test files; valid persisted transitions still
run through the matrix validator; the status update atomically checks persisted
current status; stale persisted status rejects with `COMPLAINT_INVALID_TRANSITION`
before history or audit writes; successful status, history, and WORKFLOW audit
writes still share one transaction.

Required proof re-ran and passed: lint, typecheck, test 20/20,
test:api -- workflow 7/7, and openapi:check.

The F2-02B verify gate is cleared. Phase 2 continues with `F2-02C`.

## REPAIR-F2-02B Built - Verify Gate

`REPAIR-F2-02B` fixed the stale persisted-status gap found by `VERIFY-F2-02B`.
Complaint transitions now update status only when the complaint's persisted
current status matches the expected `fromStatus`; a mismatch rejects with stable
`COMPLAINT_INVALID_TRANSITION` before status history or WORKFLOW audit is written.

Required proof passed: lint, typecheck, test 20/20, test:api -- workflow 7/7, and
openapi:check.

AUTO PHASE stops here because `F2-02B` remains a `Verify Gate: required`.

## VERIFY-F2-02B Repair Required

Independent VERIFY re-ran all required proof commands successfully: lint,
typecheck, test 20/20, test:api -- workflow 6/6, and openapi:check.

Decision: Repair. `applyTransition` validates caller-provided `fromStatus`, but
the persistence write updates by `complaintId` only and never atomically checks
the complaint's persisted current status before writing status history and
WORKFLOW audit. Because `F2-02C` builds the HTTP transition route directly on this
path, repair `F2-02B` before continuing.

## F2-02B Built - Verify Gate

`F2-02B` added complaint transition persistence through the service/repository:
valid transitions update complaint status, insert status history, and write a
WORKFLOW audit entry in one transaction. `test:api -- workflow` now covers the
matrix, invalid transitions, unauthorized roles, same-transaction persistence, and
pre-transaction denials.

AUTO PHASE stops here because `F2-02B` is marked `Verify Gate: required`.

## Out-of-Band Shared Pack Extracted (F1-06D)

At user request, extracted the accepted Phase 1 security-baseline mechanism and
proof-test guidance into a shared local agent pack:
`C:/Users/dryos/.agents/packs/forge-security-baseline`.

This did not move the Phase 2 cursor. The active next build task remains
`F2-01A - Add Complaint Transition History Metadata Schema And Migration`.

## Phase 2 - Planning Started (PLAN-F2-01)

PLAN-F2-01 reconciled the already-applied F0-08 complaint schema against
`REQ-COMPLAINT-001`, `ARCH-WORKFLOW-001`, `WORKFLOW-MATRIX-001`,
`ARCH-DATA-001`, `METHOD-AUDIT-001`, and `API-STANDARD-001`.

Result: the complaint-core tables already exist, but
`complaint_status_history` needs transition provenance fields before the backend
state-machine kernel is built. `F2-01A` is queued as the smallest buildable first
task. The state-machine persistence task `F2-02B` remains `Verify Gate: required`
because later complaint creation and queue behavior depend on it.

## Phase 1 — Accepted (PHASE-1-REVIEW)

PHASE-1-REVIEW decision: **Accept With Conditions** (PHASE-REVIEWER, Opus 4.8, 2026-06-18).
All 23 Phase 1 tasks done with honest, independently-reproduced evidence. Full proof surface
re-run green: lint, typecheck, test 20/20, test:api -- auth 21/21, -- admin 15/15,
-- security 4/4, -- audit 8/8 + live append-only proof, openapi:check, build. NFR-SEC-001
AC1/AC2/AC3/AC5 met; the MVP "Security baseline" gate is satisfied. Every Verify Gate was
honored by an independent VERIFY. Full record in `.forge/trust.md` (PHASE-1-REVIEW). Phase 2
is cleared to start; it opens with a planner pass.

### Non-blocking conditions carried into later phases (see trust.md PHASE-1-REVIEW)

1. `security:check` is still a fail-loud placeholder — wire it to the real security suites
   before the MVP pilot sign-off gate (substance is proven by `test:api -- security/auth/admin/audit`).
2. NFR-SEC-001 AC4 (prod HTTP→HTTPS at the gateway) + parameterizing `POSTGRES_HOST_AUTH_METHOD: trust`
   are owed by the Phase 7 deployment runbook (F7-04).
3. No full Nest bootstrap/e2e test yet (F1-06C added reflection-metadata guard tests + fixed the
   branches DI graph). Add a bootstrap smoke test early in Phase 2.
4. Per-module `PrismaService`/`AuditService` duplication — consider a shared `@Global()` core module
   in Phase 2.
5. Deferred auth features: username login, account-lock, password-reset land with their feature tasks.

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


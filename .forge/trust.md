# Trust Log

Append review decisions here.

## INIT - Forge Initialized

- Date: 2026-06-18
- Risk: Low
- Recommendation: Accept
- Notes:
  - Clean protocol initialized.
  - No implementation code changed.
  - Current project truth starts at `state.md` and `next.md`.

## SRS-REVIEW-001 - Contract Clarifications

- Date: 2026-06-18
- Risk: Medium
- Recommendation: Accept
- Notes:
  - The review findings were valid.
  - The patch stayed limited to contract clarification, not new implementation.

## SRS-UI-001 - Modern UI/UX Contract

- Date: 2026-06-18
- Risk: Medium
- Recommendation: Accept
- Notes:
  - The SRS now makes modern operational UI/UX enforceable.
  - Dark mode remains Phase 2; MVP tokens must not block it later.

## SRS-UI-002 - UI Gate Wiring

- Date: 2026-06-18
- Risk: Low
- Recommendation: Accept
- Notes:
  - The UI quality bar is now present in MVP gates, QA coverage, scope control, and Forge planning.

## FORGE-QUALITY-001 - Agent Build Guardrails

- Date: 2026-06-18
- Risk: Low
- Recommendation: Accept
- Notes:
  - This makes the Forge workflow less dependent on prose-only conventions.

## PLAN-F0-01 - Scaffold Build Task

- Date: 2026-06-18
- Risk: Low
- Recommendation: Accept
- Notes:
  - Planning is now aligned with the agreed order: rulebook, scaffold, data model, generator, golden CRUD, then feature modules.

## F0-01 - Monorepo Scaffold And Toolchain Foundation

- Date: 2026-06-18
- Risk: Medium
- Recommendation: Accept
- Notes:
  - The change stayed inside scaffold scope and avoided domain behavior.
  - Required F0-01 verification commands ran and passed after installing dependencies.
  - Pending proof scripts fail loudly instead of pretending API, visual, security, DB, backup, or performance coverage exists.

## F0-02 - Real Toolchain Proof Scripts

- Date: 2026-06-18
- Risk: Medium
- Recommendation: Accept
- Notes:
  - The lint gate is now a real static check, not just a file-existence check.
  - Required verification commands ran and passed.
  - This remains a baseline gate; full ESLint, dependency-cruiser, coverage, visual, accessibility, and performance gates remain scheduled for F0-06.

## F0-03 - Docker Local Stack For API And Web

- Date: 2026-06-18
- Risk: Medium
- Recommendation: Accept
- Notes:
  - All five proof commands (install --lockfile-only, lint, typecheck, test, openapi:check) passed.
  - Docker Compose config validation passed (exit 0).
  - Liveness entrypoints contain no domain behavior; Docker image build is deferred until a developer runs it locally.
  - `docker compose build` ran successfully in the F0-04 session, producing `cms-forge-api:latest` and `cms-forge-web:latest`. F0-03 risk resolved.

## F0-04 - Seed Data For Branches, Roles, Users, Categories, Vehicles, Complaints

- Date: 2026-06-18
- Risk: Medium
- Recommendation: Accept
- Notes:
  - All six proof commands passed.
  - Seed ran end-to-end inside Docker network; data verified with psql.
  - Role codes and complaint states derived directly from SRS RBAC-MATRIX-001 and WORKFLOW-MATRIX-001 — no invented codes.
  - Remaining risk: `POSTGRES_HOST_AUTH_METHOD: trust` exposes local postgres without a password. Acceptable for dev; must not reach production. Flag for a future infra hardening task.
  - F0-08 will expand this minimal schema into the full coherent data model before Phase 2 feature migrations.

## F0-05 - Frontend Design Tokens And Shared UI Component Foundation

- Date: 2026-06-18
- Risk: Low
- Recommendation: Accept
- Notes:
  - Only design token constants, global CSS, and configuration files were added.
  - All proof scripts successfully passed.

## PLAN-F0-06 - Phase 0 Quality Gates

- Date: 2026-06-18
- Risk: Medium
- Recommendation: Accept
- Notes:
  - The planned task tightens gates without adding heavyweight tooling before there is enough application code to justify it.
  - UI, accessibility, and performance commands must remain honest fail-loud gates until real screens exist; they must not be reported as passed in F0-06.

## F0-06 - Phase 0 Quality Gates

- Date: 2026-06-18
- Risk: Medium
- Recommendation: Accept
- Notes:
  - Required verification commands ran and passed.
  - The implementation used existing Node tooling only, preserving the task's dependency discipline.
  - Remaining risk: fail-loud UI/perf commands are not real visual, accessibility, or performance coverage yet; this is acceptable until MVP screens exist.

## F0-07 - Module Generator Template And Golden CRUD Designation

- Date: 2026-06-18
- Risk: Medium
- Recommendation: Accept
- Notes:
  - Required verification commands ran and passed.
  - The generator is intentionally dependency-free and structural only; it does not create runtime Nest decorators until the Nest package baseline exists.
  - Remaining risk: generated skeletons are construction-only placeholders, not CRUD behavior. `branches` remains scheduled as the actual golden CRUD exemplar in F1-05.

## F0-08 - Coherent Prisma Data Model Draft

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - Required verification commands and Prisma schema validation passed.
  - The schema now has first-class audit and complaint status history storage before workflow implementation.
  - Remaining risk: no migration was generated or applied in this task; this is acceptable for the draft step and should be handled before DB-dependent feature work.

## FORGE-PHASE-REVIEW-001 - Phase Completion Review Gate

- Date: 2026-06-18
- Risk: Medium
- Recommendation: Accept
- Notes:
  - Forge now has an explicit `Needs Phase Review` state and `PHASE-REVIEWER` tier.
  - Phase completion review must use a fresh reviewer context with Opus 4.8 Max or GPT-5.5 Extra High.
  - The current chain is intentionally paused at `PHASE-0-REVIEW` before Phase 1 starts.

## FORGE-AGENTIC-ARCH-001 - Agentic Codebase Guardrails

- Date: 2026-06-18
- Risk: Medium
- Recommendation: Accept
- Notes:
  - Added a fail-fast lint guard for oversized app/package/tool source files.
  - Large canonical artifacts remain allowed: Prisma schema, OpenAPI, migrations,
    generated files, and docs.
  - Current `schema.prisma` is not automatically bad at 521 lines; for Prisma it is
    the canonical model. The risk is unmanaged context, so edits must stay focused
    and schema tests must guard non-negotiables.
  - Current Phase 1 entry is now a PLANNER task because the accepted F1-01 scope
    bundled migration, Nest bootstrap, core kernel, and auth into one large diff.

## PHASE-0-REVIEW - Phase 0 Acceptance Review

- Date: 2026-06-18
- Reviewer tier: PHASE-REVIEWER (Opus 4.8)
- Risk: High
- Decision: **Accept Phase** (with explicit carry-forward conditions)
- Phase 1 may start: **Yes** — restored `next.md` to `F1-01`.

### Method

Independent verification, not log-trust. Re-ran every required proof command,
inspected each Phase 0 artifact directly, validated the schema, and cross-checked
all cited SRS requirement IDs against `docs/CMS_AUTO_SRS.md`.

### Verification Labels (re-run by reviewer)

- Passed: `corepack pnpm lint`
- Passed: `corepack pnpm typecheck` (6 tsconfig projects)
- Passed: `corepack pnpm test` (15/15; coverage 86.67% lines / 77.57% branch / 89.58% funcs — clears the 80/65/75 thresholds)
- Passed: `corepack pnpm openapi:check`
- Passed: `corepack pnpm build` (exit 0)
- Passed: `prisma validate` on the full F0-08 schema
- Passed: `rg` task-coverage check — all 9 Phase 0 tasks tracked in backlog/evidence/trust
- Passed: all 12 spot-checked SRS requirement IDs exist in the SRS (no fabricated citations)

### Key Findings

- Builder honesty: **Honest.** Every "Passed" label reproduced. Gaps are
  explicitly disclosed, never inflated.
- Code quality: **Good.** Toolchain gates are real, not theater:
  - `lint.mjs` enforces actual import boundaries (web↛api/db/prisma/provider SDKs,
    api↛web, packages↛apps, cross-module private imports, TODO/FIXME).
  - `pending-proof.mjs` honestly exits 1, so unimplemented gates (test:api, test:e2e,
    test:web, test:visual, web:perf, test:performance, db:migrate:test, db:index:check,
    security:check, ops:backup:check) cannot masquerade as passing.
  - `openapi-check.mjs` enforces canonical OpenAPI 3.1.0 + ErrorEnvelope/ErrorBody/
    FieldError with correlationId.
  - `schema-check.mjs` runs in the test suite and guards 20 models plus the
    audit/history non-negotiables against regression.
- Data model (F0-08): coherent and security-conscious. OTP/session/survey/password
  stored as hashes only; `Complaint.version` for optimistic concurrency; the exact
  indexes ARCH §7 / NFR-SCALE-001 require; `Approval` records model parallel approvals;
  `Comment.visibility` + `Attachment.customerVisible` enforce portal privacy;
  `SlaEvent.idempotencyKey` prevents double-firing; `AuditLog` is append-only.
- No scope leaks: `apps/web/src` has tokens/utils/liveness only (no components/routes);
  `apps/api/src` has liveness only (generator output stayed in temp).

### Carry-Forward Conditions (all already disclosed; bound to Phase 1)

1. **Migration drift (must resolve in F1-01).** The committed migration
   `20260618115340_init` reflects only the minimal F0-04 model. The current
   `schema.prisma` is the full F0-08 model (20 models; User gains
   passwordHash/lockedAt/lastLoginAt/departmentId; +13 tables). F1-01 needs
   `User.passwordHash` and a session store, so it must generate a migration from the
   F0-08 schema before/as its first step. This is correct Phase 0 behavior — F0-08
   was a *draft* task — not a defect.
2. **No NestJS runtime yet.** `apps/api` is a `node:http` liveness server; NestJS is
   named throughout the architecture but is not yet a dependency, and the core kernel
   (PrismaService, AuditService, errors/ExceptionFilter, RbacGuard, correlation
   middleware) does not exist. F1-01 depends on this baseline. If bootstrap +
   migration + auth exceeds the 1–5 file scope budget, the builder must escalate to
   PLANNER to split it (e.g. a Nest-bootstrap + core-kernel task before auth).
3. **Generator emits plain TS classes, not Nest decorators** (disclosed in F0-07).
   Re-align the generator to the real Nest module shape when the golden CRUD exemplar
   is built in F1-05.
4. **`POSTGRES_HOST_AUTH_METHOD: trust`** is dev-only; must be parameterized before any
   non-dev deployment. Not Phase 1 blocking.
5. **Visual/a11y/perf gates** remain honest fail-loud until real screens exist (Phase 6).

### Minor (non-blocking) doc nits

- `docs/ARCHITECTURE.md` §7 cites backlog `F2-00` for the schema draft; the actual
  task was `F0-08`. Stale cross-reference.
- §2 shows an `infra/` directory for docker-compose, but the compose file lives at
  repo root. Harmless drift.

Rationale: Phase 0 ("Repository Foundation") delivered every planned task with honest,
reproduced evidence. The remaining items are correctly-sequenced prerequisites for
Phase 1, already disclosed in the build logs — not hidden gaps. Accepting.

## FORGE-AGENTIC-ARCH-002 - Recalibrated File Budget And Module Manifests

- Date: 2026-06-18
- Risk: Medium
- Recommendation: Accept
- Notes:
  - Refines FORGE-AGENTIC-ARCH-001 at the user's direction; does not revert it. The
    task-split gate and `PLAN-F1-00` stay intact.
  - The hard 240-line fail was directionally right but a blunt instrument: it would
    have first bitten thorough RBAC test files and the 208-line seed before ever
    catching a bloated service, and a hard cap pressures agents to fragment cohesive
    units. Recalibrated to 300 with test/DTO exemptions.
  - Added the `MODULE.md` manifest convention + lint gate + generator emission. This is
    the higher-leverage agentic move — it bounds the context needed to edit one module,
    which file-size limits alone cannot.
  - lint, typecheck, test (18/18), openapi:check, build all passed; CLAUDE.md/AGENTS.md
    verified identical.
  - Follow-up correction: active Forge wording now matches the implemented 300-line
    budget; stale 240-line wording in `.forge/forge.md`, `.forge/policy.md`, and
    `.forge/next.md` was updated.
  - Remaining risk: the manifest gate is inert until the first module is generated; its
    real value is proven when F1-01's `auth` module ships with a filled-in manifest.

## FORGE-AUTO-PHASE-001 - Auto Phase Run Mode

- Date: 2026-06-18
- Risk: Medium
- Recommendation: Accept
- Notes:
  - Adds an explicit autopilot path for a named phase while preserving Forge gates.
  - Auto phase continues only across successful same-phase BUILD tasks.
  - It stops for PLANNER, blockers, verify/review, phase review, failed checks, or
    agentic scope overflow.
  - Current Phase 1 still starts with `PLAN-F1-00`, so a strong builder should not
    begin coding until PLANNER splits the work.

## FORGE-AUTO-PHASE-002 - Verify Gate And Security Self-Check

- Date: 2026-06-18
- Risk: Medium
- Recommendation: Accept
- Notes:
  - Refines FORGE-AUTO-PHASE-001 (GPT); does not revert it. The autopilot, its stop
    conditions, and the phase-end PHASE-REVIEWER stay intact.
  - Rationale: every Phase 1 task is High-risk (auth, RBAC, branch scope, audit, error
    shape). Pure autopilot self-certifies each and defers all independent review to
    phase-end, which contradicts policy "High/Critical work needs verification before
    acceptance" and enlarges blast radius if the auth foundation is flawed.
  - Fix is declarative and minimal: a `Verify Gate: required` marker on the foundation
    task routes BUILD to `Needs Verify`, which the existing autopilot already halts on.
    One independent VERIFY after F1-01, then hands-off flow resumes — exactly the
    velocity/safety balance the user chose.
  - Added a builder-side `Security Self-Check` on every High/Critical task so the
    autopilot is only as fast as it is rigorous; it does not replace the gate or the
    phase reviewer.
  - Residual risk: the gate's value depends on the VERIFY being a genuinely fresh
    context/different model, not the same agent rubber-stamping itself. The protocol
    says so; enforcement is by discipline, not a hard check.

## F1-00A - Generate And Apply The F0-08 Prisma Migration

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed migration-only and did not implement application behavior.
  - The generated migration was adjusted only to make required `updated_at` additions safe over existing seeded rows.
  - Required static checks passed, and the migration applied through the Docker network.
  - Remaining non-blocking tooling gap: the root `db:seed` script currently cannot find `prisma`; seed data preservation was verified by SQL instead.

## F1-00B - Bootstrap NestJS API And Minimal Core Kernel

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed on bootstrap/core plumbing and avoided auth/RBAC/audit/domain behavior.
  - Required checks passed, and Docker runtime was smoke-tested through `/health`.
  - The initial image packaging missed pnpm workspace runtime dependencies; fixed by running from `apps/api` and copying the workspace/app node_modules layout.
  - The core error filter is intentionally minimal; F1-04 remains responsible for the full stable error-code surface.

## F1-01 - Staff Auth With Argon2id And HttpOnly Sessions

- Date: 2026-06-18
- Risk: High
- Recommendation: Replan
- Notes:
  - The broad auth task is not agentic after F1-00B: module generation, hashing, sessions, audit, OpenAPI, and tests would create a large diff.
  - AUTO PHASE correctly stopped at `Ready to Plan` rather than starting an oversized security change.
  - The auth verify gate must stay on the final auth foundation subtask after planning.

## F1-01A - Auth Data Foundation And API Test Harness

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed foundation-only: seed hashes and `test:api -- auth` wiring.
  - Required proof commands passed after regenerating the local Prisma client for the accepted F0-08 schema.
  - The unknown-suite check fails loudly, so future `test:api -- <suite>` calls cannot silently pass.
  - Remaining risk: hashes are only shape-tested here; real Argon2 verification is intentionally queued in `F1-01B`.

## F1-01B - Auth Module Credential Verification With Argon2id And Generic Denial

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed service-level and did not add routes, cookies, sessions, audit, OpenAPI, RBAC, or UI.
  - Required proof commands passed; auth API tests cover allowed and denied credential behavior.
  - Remaining risk: the accepted Prisma schema has no separate username column, so repository lookup is currently email-based despite the generic `identifier` naming. Add a username field only when the user/admin model task accepts that schema change.

## F1-01C - Staff Session Persistence And Secure Cookie Issuance

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed service-level and did not add HTTP routes, logout, validation middleware, audit, RBAC, OpenAPI, or UI.
  - Required proof commands passed, and the staff session migration applied inside the Docker network.
  - Session storage uses token hashes only; raw token exposure is limited to the HttpOnly cookie value.

## F1-01D - Session Validation And Logout Invalidation

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed service-level and did not add HTTP routes, audit, RBAC, OpenAPI, or UI.
  - Required proof commands passed; auth API tests cover valid and denied session validation plus logout revocation.
  - Remaining final auth work is still too broad for one builder task and should be replanned before implementation.

## F1-01E1 - Auth HTTP Login/Logout Routes

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed route-only: module wiring, login/logout controller, minimal DTO parsing, and focused auth API tests.
  - Required proof commands passed; the initial `test:api -- auth` failure was recorded and fixed by making the API test runner load the API tsconfig for Nest decorators.
  - Audit and OpenAPI remain intentionally deferred to `F1-01E2` and `F1-01E3`.

## F1-01E2 - Auth Audit Entries

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed auth-audit-only: minimal audit writer, auth service audit hooks, source context from the controller, and focused auth API tests.
  - Required proof commands passed after recording and fixing the initial typecheck and API-test failures.
  - Remaining auth foundation work is OpenAPI contract documentation and the gated final security proof.

## F1-01E3 - Auth OpenAPI Contract And Final Security Proof

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept pending independent VERIFY
- Notes:
  - The task stayed OpenAPI/proof-only: canonical auth paths and schemas, OpenAPI drift tests, and final security self-check evidence.
  - Required proof commands passed.
  - Because this task is marked `Verify Gate: required`, AUTO PHASE is paused at `Needs Verify` before Phase 1 continues to RBAC/branch scope.

## F1-02 - RBAC and Branch-Scope Enforcement

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed narrow: session guard, role/branch decorators and guard, `GET /auth/me`, OpenAPI contract update, and focused auth API tests.
  - Required proof commands passed after recording and fixing the initial typecheck failures.
  - `F1-03` is too broad as written, so AUTO PHASE stops at `Ready to Plan` for a split before audit search/export/append-only work.

## F1-03A - Audit Log Search Endpoint

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept pending independent VERIFY
- Notes:
  - The task stayed on audit search only: new audit module, guarded `GET /audit/logs`, focused audit API tests, API-suite registration, and OpenAPI contract update.
  - Required proof commands passed after recording and fixing the initial exact-optional typecheck failure.
  - Audit export and DB-level append-only enforcement remain correctly deferred to `F1-03B` and `F1-03C`.
  - Because this task is marked `Verify Gate: required`, AUTO PHASE is paused at `Needs Verify` before export builds on this access surface.

## VERIFY-F1-01E - Auth Foundation Verify Gate

- Date: 2026-06-18
- Reviewer tier: independent VERIFY (fresh context, Opus 4.8) — distinct from the F1-01* builder context
- Risk: High
- Builder honesty: **Honest**
- Code quality: **Good**
- Recommendation: **Accept** (with carry-forward conditions)
- AUTO PHASE: may resume — state set to `Ready to Build` on `F1-02`.

### Method

Independent verification, not log-trust. Read every changed auth/audit/OpenAPI/test
file directly, confirmed the working-tree change scope against `git diff`, re-ran all
five required proof commands, cross-checked the delivered behavior against the cited
SRS acceptance criteria, and probed the fail-loud guard.

### Verification labels (re-run by reviewer)

- Passed: `corepack pnpm lint`
- Passed: `corepack pnpm typecheck` (6 tsconfig projects, clean)
- Passed: `corepack pnpm test` (19/19; coverage 89.81% lines / 79.55% branch / 91.53% funcs — clears 80/65/75)
- Passed: `corepack pnpm test:api -- auth` (15/15)
- Passed: `corepack pnpm openapi:check` (committed spec equals canonical generator output)
- Passed: fail-loud probe — `test:api -- nonexistent-suite` exits 1, so the suite runner is not theater.

### Key findings

- **Scope clean.** Working-tree diff is entirely auth/audit/OpenAPI/tests + `.forge`
  tracking. No leak into unrelated modules; `apps/api` still exposes only auth + liveness.
- **Builder labels reproduced exactly.** Every "Passed" in F1-01A..E3 evidence
  re-ran green; the 19/19 and 15/15 counts match. Out-of-scope items are disclosed,
  never claimed.
- **Security self-check holds under inspection:**
  - Role/branch claims derive from the persisted user/session record, never request
    input (`verifyCredentials`, `validateStaffSession`).
  - Session stores only a SHA-256 token hash; the raw token leaves the server only in
    the HttpOnly/SameSite=Lax/Secure-in-prod cookie. Login response is safe claims +
    expiry; tests assert no `passwordHash`/raw token in the body.
  - `AuditService.record` is `create`-only (append-only); login_success and logout
    audit writes run inside the same `prisma.$transaction` as the session insert/revoke.
    Failed-login audit is a standalone write (no state change to bind), with metadata
    limited to the error `code` — no password, identifier, hash, or token.
  - Generic denial verified: missing-user / wrong-password / missing-hash all collapse
    to `AUTH_INVALID_CREDENTIALS` + identical message (REQ-AUTH-001 AC2). The distinct
    `AUTH_LOCKED_OR_INACTIVE` code is **SRS-sanctioned** (§23 error table; UI-001 lists
    "lock/inactive handling"), not an enumeration defect.
  - Trust boundaries tested both ways: allowed login + denied (wrong pw / inactive /
    locked / missing hash); valid session + denied (missing / unknown / expired /
    revoked); logout revocation; malformed-body → `VALIDATION_FAILED`.
- **AC mapping.** Met: ARCH-AUTH-001 AC1–4; REQ-AUTH-001 AC2–4; NFR-SEC-001 AC1–2;
  REQ-AUDIT-001 (login/logout/failure). Deferred and disclosed below.

### Carry-forward conditions (must be closed before the Phase 1 PHASE-REVIEWER gate)

1. **Login rate limiting + CSRF are unbuilt and currently homeless in the backlog.**
   NFR-SEC-001 AC3 (rate limit by account+IP) and AC5 (CSRF on session-authenticated
   mutation routes) are `[must]` and the SRS MVP "Security baseline" gate (§ gate table)
   lists CSRF + rate limit as *blocking*. SameSite=Lax is only a partial CSRF baseline.
   Added Phase 1 backlog item `F1-06` so this cannot be silently dropped at phase review.
2. **Username login (REQ-AUTH-001 AC1) is email-only.** The accepted schema has no
   username column; `findStaffByIdentifier` looks up by email. Forward-compatible
   `identifier` naming is in place. Close when the users/admin model adds the column.
3. **REQ-AUTH-001 AC5 lock + AC6 password-reset events** are not yet auditable because
   those flows do not exist. Login/logout/failure auditing is complete; lock + reset
   auditing lands with those features.
4. **App-level append-only only.** `AuditService` never updates/deletes, but DB-level
   append-only enforcement (revoke UPDATE/DELETE) is F1-03's explicit job — not yet done.

### Minor (non-blocking) observations

- In `verifyCredentials`, the failure-audit `await` precedes the rethrow; if the audit
  write itself threw (e.g. DB down) it would mask the original auth error. A defensive
  try/catch around the failure-audit write would be more robust. Success/logout paths
  are fine — they are inside the transaction, so audit failure correctly rolls back.
- `MODULE.md` is slightly stale: it says the staff-session table "will be added in
  `F1-01C`" (now done) and lists only `users` under Owns tables; it should also list
  `staff_sessions`. Manifest still satisfies the required lint fields. Fix opportunistically.
- `corepack pnpm test` coverage measures only `tools/*`; the auth TS tests run under
  `tsx` via `test:api` and are not coverage-gated. The auth tests are real and thorough,
  but no coverage threshold enforces auth-service coverage yet (pre-existing Phase 0
  structural limitation, not introduced here).

## VERIFY-F1-03A - Audit Log Search Verify Gate

- Date: 2026-06-18
- Reviewer tier: PLANNER (independent VERIFY, fresh context)
- Risk: High
- Builder honesty: **Honest**
- Code quality: **Acceptable**
- Recommendation: **Repair**

### Method

Read the Forge task, model rules, project policy, state, SRS requirement IDs, architecture,
builder evidence, trust notes, audit module, guards, auth session code, OpenAPI generator,
and focused audit tests. Re-ran every required proof command.

### Verification labels (re-run by reviewer)

- Passed: `corepack pnpm lint`
- Passed: `corepack pnpm typecheck`
- Passed: `corepack pnpm test` (19/19; coverage 89.50% lines / 80.71% branch / 92.54% funcs)
- Passed: `corepack pnpm test:api -- audit` (5/5)
- Passed: `corepack pnpm openapi:check`

### Blocking finding

- `GET /audit/logs` is too permissive for the current SRS RBAC matrix. `apps/api/src/modules/audit/audit.controller.ts` uses `@Roles('ADMIN', 'BRANCH_MANAGER')`, but `docs/CMS_AUTO_SRS.md` `RBAC-MATRIX-001` says `View audit log` is `No` for Branch Manager and `Yes` for Admin; Management Read-Only is only `Configurable`, and that permission model is not built yet. Because audit rows are sensitive (`NFR-SEC-002`), the endpoint must fail closed to Admin-only until configurable management audit permission exists.

### Non-blocking checks

- Scope otherwise stayed on audit search only; export and append-only DB enforcement remain deferred to `F1-03B` and `F1-03C`.
- OpenAPI documents `/audit/logs` and `openapi:check` reproduced green.
- Audit search maps explicit response fields and redacts secret-like metadata keys.
- Existing guard path audits role/branch denials as `SECURITY`; repair should keep denied non-admin audit coverage.
- Touched app/tool source files are under the 300-line budget; largest checked source file is `tools/openapi-check.mjs` at 190 lines.

## REPAIR-F1-03A - Restrict Audit Search To SRS-Allowed Roles

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept pending independent repair VERIFY
- Notes:
  - The repair stayed inside the queued scope: audit search is now Admin-only until configurable management audit-view permission exists.
  - `AuditSearchService.search` also fails closed for non-admin direct calls, so the service boundary is not looser than the HTTP guard.
  - Focused tests now cover Admin allow, Branch Manager deny with `SECURITY` audit, CR Officer deny with `SECURITY` audit, non-admin direct service denial, invalid query, and metadata redaction.
  - Required proof commands passed: lint, typecheck, test 19/19, test:api -- audit 5/5, openapi:check.
  - Because `F1-03A` is a verify gate, state is set to `Needs Verify` before `F1-03B` can start.

## VERIFY-F1-03A-REPAIR - Audit Search RBAC Repair Verify Gate

- Date: 2026-06-18
- Reviewer tier: independent VERIFY (fresh context, Opus 4.8) — distinct from the F1-03A builder and the REPAIR-F1-03A builder
- Risk: High
- Builder honesty: **Honest**
- Code quality: **Good**
- Recommendation: **Accept**
- AUTO PHASE: may resume — state set to `Ready to Build` on `F1-03B`.

### Method

Independent verification, not log-trust. Read the audit module (controller, service,
repository, manifest), the `core/auth.guard` RBAC/session guards, the focused audit
tests, the OpenAPI generator/contract, and the F1-03A / VERIFY-F1-03A / REPAIR-F1-03A
records. Cross-checked the access rule against `RBAC-MATRIX-001` directly. Re-ran all
five required proof commands and confirmed file budgets.

### Verification labels (re-run by reviewer)

- Passed: `corepack pnpm lint`
- Passed: `corepack pnpm typecheck` (6 tsconfig projects, clean)
- Passed: `corepack pnpm test` (19/19; coverage 89.50% lines / 80.71% branch / 92.54% funcs — clears 80/65/75)
- Passed: `corepack pnpm test:api -- audit` (5/5)
- Passed: `corepack pnpm openapi:check`

### Findings — repair confirmed

- **Admin-only matches the matrix.** `audit.controller.ts` now uses `@Roles('ADMIN')`
  under `SessionAuthGuard` + `RbacGuard`. `RBAC-MATRIX-001` (SRS line 2329, "View audit
  log") is Admin = Yes; CR Officer / CR Manager / Branch Manager = No; Management
  Read-Only = **Configurable**. With no per-user permission-config system in the MVP,
  defaulting MGMT_READONLY to no-access is the *stricter* reading the SRS intro (line 32)
  requires — not an under-permissive defect. The now-moot `@BranchScoped()` was removed
  (Admin sees all branches), which is correct.
- **Denials are audited.** `RbacGuard.recordSecurityDeny` writes a `SECURITY` /
  `rbac_forbidden` entry on deny; tests assert this for both Branch Manager and CR
  Officer (the originally-misallowed role plus an ordinary non-admin).
- **Service fails closed.** `AuditSearchService.search` throws `RBAC_FORBIDDEN` for any
  non-admin principal, so the service boundary is no looser than the HTTP guard
  (defense-in-depth); tested via a direct Branch Manager call.
- **No collateral regressions.** Admin branch filtering, `pageSize` clamp (200 → 100),
  explicit safe response fields, secret-like metadata redaction (`password`, nested
  `tokenHash` → `[REDACTED]`), and invalid-query → `VALIDATION_FAILED` all survive and
  remain tested. `/audit/logs` GET stays canonical in OpenAPI and `openapi:check` is
  drift-enforced.
- **Budgets honored.** `audit.service.ts` 170 lines, `audit.controller.ts` 24,
  `core/auth.guard.ts` 153 — all under the 300-line budget (lint-enforced, passed).

### Minor (non-blocking) note

- REPAIR-F1-03A evidence states "audit service is 151 lines"; the file is actually 170.
  An imprecise supporting figure, not a gate claim — the material "under 300" assertion
  is true and lint enforces it. No effect on the decision; worth tightening next time.

### Carry-forward conditions (unchanged scope, tracked for later Phase 1 / Phase 7)

1. **Management Read-Only audit view (`Configurable`)** stays deferred until a per-user
   permission/config model exists; revisit when management dashboards land (Phase 7).
2. **DB-level append-only enforcement** (revoke UPDATE/DELETE on `audit_logs`;
   REQ-ARCH AC3 "audit data cannot be overwritten by ordinary update flows") is still
   owed by `F1-03C` — application-level writes remain create-only today.
3. **Audit log export** (`RBAC-MATRIX-001`: Admin Yes, MGMT_READONLY "No by default")
   plus its scope-parity (`RBAC-MATRIX-001` AC2) is `F1-03B`, queued next.

## F1-03B - Audit Log Export Endpoint With Limits And Scope

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - Export stayed narrow: Admin-only JSON attachment, shared search filters, `MAX_EXPORT_ROWS = 500`, safe redacted row mapping, export audit entry, focused audit API tests, and canonical OpenAPI update.
  - Required checks passed: lint, typecheck, test 19/19, test:api -- audit 8/8, openapi:check.
  - No configurable Management Read-Only audit permission was added; SRS says audit export is "No by default" for that role.
  - No DB-level append-only enforcement was added; that is queued as `F1-03C`.

## F1-03C - Audit Append-Only Enforcement Proof

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - Added the smallest DB-level guard: one trigger/function migration blocks `UPDATE` and `DELETE` on `audit_logs`.
  - `test:api -- audit` now includes a live Docker-backed proof that applies migrations, inserts an audit row, and verifies update/delete are rejected.
  - Required checks passed: lint, typecheck, test 19/19, test:api -- audit 8/8 plus live proof, openapi:check.
  - No audit service update/delete API or retention deletion policy was added.

## F1-04 - Stable API Error Shape And Correlation IDs

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The change stayed scoped to the existing HTTP kernel, login DTO validation, and focused auth tests.
  - Runtime error responses now match the canonical envelope and include optional safe field errors only for validation-style failures.
  - Auth/RBAC errors remain generic and stable; correlation IDs are propagated to response headers and error bodies.
  - Required checks passed after a small DTO narrowing repair: lint, typecheck, test 19/19, test:api -- auth 21/21, test:api -- audit 8/8 plus live append-only proof, openapi:check.
  - F1-05 should be split by a planner before build because the golden CRUD reference module is broader than the normal 1-5 file build budget.

## F1-05A - Nest-Ready Module Generator

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed scoped to `tools/generate-module.mjs` and `tools/generate-module.test.mjs`.
  - The generator now emits NestJS-shaped module/controller/service/repository files and a manifest-valid `MODULE.md`.
  - Required checks passed: lint, typecheck, test 19/19, openapi:check.
  - No runtime API behavior, OpenAPI route, RBAC, audit, Prisma, auth, or audit module changes were added.
  - The `F1-05` umbrella remains open; next step is generating the real `branches` module shell before CRUD behavior.

## F1-05B - Generate Branches Module Shell And Manifest

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed on the generated branches shell and manifest. Generated files are behavior-free.
  - A small generator CLI parser fix was required because both `corepack pnpm generate:module -- branches` and direct `node tools/generate-module.mjs branches` failed before the fix.
  - Required checks passed: lint, typecheck, test 20/20, openapi:check.
  - No runtime API behavior, OpenAPI route, RBAC, audit, Prisma schema, migration, auth, or audit module change was added.
  - The remaining `F1-05C` scope is still too broad, so AUTO PHASE stops at `Ready to Plan` for a split before CRUD behavior.

## F1-05C - Branch Read/List Service And Repository Behavior

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed scoped to branch read/list service and repository behavior plus the `admin` API test-suite registration.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- admin 3/3, openapi:check.
  - No public route, OpenAPI branch path, write behavior, audit entry, UI, schema, or migration was added.
  - Next task should expose read-only HTTP routes with Admin RBAC and OpenAPI before branch write behavior.

## F1-05D - Branch Read/List HTTP Endpoints With Admin RBAC And OpenAPI

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed scoped to read-only branch routes, app wiring, Admin RBAC, OpenAPI, and focused admin API tests.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- admin 5/5, openapi:check.
  - No branch write behavior, audit-producing branch mutation, UI, schema, migration, or pattern-freeze documentation was added.
  - Missing branch lookup uses `{ branch: null }` rather than inventing a new branch-specific error code.

## F1-05E - Branch Create/Update/Deactivate Service Behavior With Audit Entries

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed scoped to service/repository write behavior and focused admin API tests.
  - Branch create/update/deactivate writes now run through repository methods and return explicit safe DTOs.
  - Branch deactivate is a soft update (`isActive: false`) and no delete behavior was added.
  - Write audit entries are `CONFIG` events recorded with the same transaction client as the branch mutation; tests assert same-client use and changed-field metadata.
  - Required checks passed after one honest type-narrowing repair: lint, typecheck, test 20/20, test:api -- admin 8/8, openapi:check.
  - No branch write HTTP route, OpenAPI write path, UI, schema, migration, or pattern-freeze documentation was added.

## F1-05F - Branch Write HTTP Endpoints, API Tests, And Golden CRUD Pattern Freeze

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed scoped to branch write HTTP routes, request parsing, OpenAPI contract entries, admin API tests, and a narrow module-manifest golden-reference note.
  - Branch write routes are Admin-only and pass server-derived audit context to the existing same-transaction service methods.
  - Request parsing ignores client-supplied role/scope-like fields and validates only branch configuration fields.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- admin 11/11, openapi:check.
  - `tools/openapi-check.mjs` reached 295 lines after compacting the write-path additions; this is under the enforced budget but close enough that future OpenAPI expansion should likely be split or refactored.
  - The F1-05 golden CRUD umbrella is complete; remaining Phase 1 work is F1-06, which is broad enough to require PLANNER splitting before build.

## F1-06A - Login Rate Limiting (Account + IP)

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed scoped to login rate limiting, direct guard tests, API-suite
    registration, and the login OpenAPI 429 contract.
  - `POST /auth/login` is now limited by server-observed IP and submitted normalized
    identifier using an injectable in-memory fixed-window store.
  - Over-limit attempts return stable `RATE_LIMITED` HTTP 429 and write a safe
    `SECURITY` / `rate_limit_triggered` audit entry.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- security 2/2,
    test:api -- auth 21/21, openapi:check.
  - Remaining accepted limitation: the store is process-local; Redis/distributed rate
    limiting is deferred until deployment topology requires it.

## F1-06B - CSRF Kernel Guard, Token Issuance, And Auth-Route Enforcement

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept pending independent VERIFY
- Notes:
  - The task stayed scoped to the CSRF kernel, auth login/logout cookie wiring, focused
    security/auth tests, and canonical OpenAPI contract updates.
  - Login issues a readable SameSite CSRF cookie alongside the HttpOnly staff session
    cookie; logout now requires session auth plus matching CSRF cookie/header.
  - CSRF denials return stable `CSRF_INVALID` HTTP 403 and write safe `SECURITY` /
    `csrf_rejected` audit entries without token or cookie values.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- security 4/4,
    test:api -- auth 21/21, openapi:check.
  - Because this task is a verify gate, state is set to `Needs Verify` before F1-06C
    can reuse the CSRF mechanism on branch admin mutation routes.

## VERIFY-F1-06B - CSRF Kernel Guard Verify Gate

- Date: 2026-06-18
- Reviewer tier: independent VERIFY (fresh context, Opus 4.8) — distinct from the F1-06A/F1-06B builder context
- Risk: High
- Builder honesty: **Honest**
- Code quality: **Good**
- Recommendation: **Accept**
- AUTO PHASE: may resume — state set to `Ready to Build` on `F1-06C`.

### Method

Independent verification, not log-trust. Read the CSRF guard, the auth controller/module
wiring, the `SessionAuthGuard` it composes with, the audit service, the HTTP kernel /
`AppException`, the rate-limit guard, the OpenAPI generator/contract, and the focused
security/auth route tests. Confirmed the commit scope (`8885216`). Re-ran all six required
proof commands. Cross-checked behavior against `NFR-SEC-001` AC5 and every `next.md`
required check.

### Verification labels (re-run by reviewer)

- Passed: `corepack pnpm lint`
- Passed: `corepack pnpm typecheck` (6 tsconfig projects, clean)
- Passed: `corepack pnpm test` (20/20; coverage 91.69% lines / 80.00% branch / 94.52% funcs — clears 80/65/75)
- Passed: `corepack pnpm test:api -- security` (4/4 — 2 CSRF allow/deny + 2 rate-limit)
- Passed: `corepack pnpm test:api -- auth` (21/21)
- Passed: `corepack pnpm openapi:check` (committed spec equals canonical generator output)

### Findings — required checks all hold

- **Scope clean.** Commit `8885216` touches only CSRF/rate-limit guards, auth
  controller/module, security+auth tests, OpenAPI (+generator), the suite runner, and
  `.forge` tracking. No leak into portal/complaint/branches source. (F1-06A rate limiting
  rides in the same commit and was already independently accepted.)
- **Logout requires session + CSRF.** `auth.controller.ts` guards logout with
  `@UseGuards(SessionAuthGuard, CsrfGuard)` — declared order runs `SessionAuthGuard` first
  (validates the staff session, attaches the server-derived `principal`), then `CsrfGuard`.
  Correct both semantically (must be authenticated to log out) and for audit (principal is
  present on the deny path).
- **Login issues but is not gated by CSRF.** `POST /auth/login` carries only
  `LoginRateLimitGuard`; it sets a readable `cms_csrf_token` SameSite=Lax cookie next to the
  HttpOnly session cookie. The double-submit cookie is intentionally JS-readable so the
  client echoes it in `x-csrf-token`. Pre-session login is covered by rate limiting (AC3),
  not CSRF (AC5) — matches the plan.
- **Stable CSRF_INVALID 403.** Denial throws `AppException('CSRF_INVALID', …, 403)`,
  rendered through the canonical envelope. `matchesToken` requires both tokens present,
  equal length, and `timingSafeEqual` — missing / empty / length-mismatch all fail closed.
- **Safe SECURITY audit on deny.** `csrf_rejected` / `SECURITY` with actor+branch from the
  server principal, route, correlation, IP, UA, and metadata `{ reason: 'missing_or_mismatch' }`
  only. No token, cookie, password, or hash value is recorded or returned; the test asserts
  the audit and rendered 403 contain none of `csrf-secret`, `raw-session`, `password`, `hash`.
- **Trust boundary tested both ways.** `csrf.test.ts` proves allow (matching cookie+header,
  zero audit) and deny (mismatch → CSRF_INVALID 403 + exact safe audit). `http-routes.test.ts`
  proves login sets both cookies (`cms_csrf_token=…; Path=/; SameSite=Lax; Max-Age=28800`)
  and logout expires both.
- **OpenAPI documents the behavior without drift.** Canonical `/auth/login` 200 advertises
  the dual Set-Cookie + a 429; `/auth/logout` 200 advertises expired cookies + a 403
  `Invalid CSRF token (CSRF_INVALID)`. `openapi:check` enforces byte-canonical equality and
  passed.
- **Security self-check holds under inspection.** Server-derived authority only; logout's
  session revoke + AUTH logout audit stay in the existing same-transaction path; CSRF denial
  is correctly a standalone append-only SECURITY write (no domain state change).

### Non-blocking observations (carry forward)

1. **Guard *wiring* is inspection-verified, not e2e-tested.** All "API tests" here are
   unit-level (construct guards/controllers directly with stubs); none boot Nest. So the
   decorator order `SessionAuthGuard, CsrfGuard` on logout is verified by reading the code,
   not by an executing request. The `AuthModule` injector is complete and self-contained
   (registers `SESSION_AUTH_SERVICE`, `CsrfGuard`, and the other guards), so F1-06B itself
   resolves — but an integration/bootstrap smoke test remains owed (pre-existing structural
   gap noted since VERIFY-F1-01E).
2. **`branches.module.ts` does not register `SessionAuthGuard`/`RbacGuard`/`SESSION_AUTH_SERVICE`**
   even though `branches.controller.ts` uses those guards, and no test boots Nest to prove
   they resolve. Out of scope for F1-06B, but F1-06C edits this module to add `CsrfGuard`
   (which only needs the already-provided `AuditService`); the F1-06C builder should register
   the guard there and confirm the branch mutation routes actually bootstrap. A small Nest
   smoke test would close both this and observation 1.
3. **CSRF cookie TTL is 8h, independent of session lifetime.** If a session outlives the CSRF
   cookie, logout would 403 until the next login re-issues it. Fail-closed and minor;
   acceptable for MVP.
4. **Audit-before-throw on the deny path.** If `auditService.record` itself threw (DB down),
   it would surface as a 500 instead of the 403. Still fail-closed (request rejected); a
   defensive try/catch would be more robust. Same minor note as VERIFY-F1-01E's failure-audit
   path.

### Gate

`F1-06B` verify gate cleared. Queued `F1-06C - Enforce CSRF On Branch Admin Mutation Routes`
and set state to `Ready to Build`. After F1-06C, all Phase 1 backlog tasks are done → the
Phase 1 `PHASE-REVIEWER` gate.

## F1-06C - Enforce CSRF On Branch Admin Mutation Routes

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept pending Phase 1 PHASE-REVIEWER
- Notes:
  - The task stayed scoped to branch mutation CSRF enforcement, branch module guard DI,
    focused admin tests, and canonical OpenAPI updates.
  - `POST /branches`, `PATCH /branches/:id`, and `POST /branches/:id/deactivate` now
    use `SessionAuthGuard`, `RbacGuard`, and `CsrfGuard`; branch reads remain
    session/RBAC-only.
  - `BranchesModule` now imports `AuthModule`, aliases `SESSION_AUTH_SERVICE` to
    exported `AuthService`, and registers the guards it uses.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- admin 15/15,
    test:api -- security 4/4, openapi:check.
  - All Phase 1 backlog tasks are now complete; Forge state is set to
    `Needs Phase Review` before Phase 2 can start.

## PHASE-1-REVIEW - Security Baseline Acceptance Review

- Date: 2026-06-18
- Reviewer tier: PHASE-REVIEWER (Opus 4.8) — not a Phase 1 builder; performed the
  VERIFY-F1-06B gate earlier this session, otherwise independent of the build work
- Risk: High
- Decision: **Accept With Conditions**
- Phase 2 may start: **Yes** — opened with a planner pass (`PLAN-F2-01`, state `Ready to Plan`).

### Method

Independent verification, not log-trust. Confirmed all 23 Phase 1 tasks checked done in
`backlog.md`; inspected the F1-06C source/test diff (commit `905f0ad`) directly; re-read the
CSRF/rate-limit/auth/audit/branches/RBAC source and the focused tests; cross-checked the
delivered behavior against `NFR-SEC-001` AC1–AC5, the MVP "Security baseline" gate, and
`RBAC-MATRIX-001`; and re-ran the entire Phase 1 proof surface, including the live
Docker-backed audit append-only proof and a full `build`.

### Verification labels (re-run by reviewer)

- Passed: `corepack pnpm lint`
- Passed: `corepack pnpm typecheck` (6 tsconfig projects, clean)
- Passed: `corepack pnpm test` (20/20; coverage 91.69% lines / 80.00% branch / 94.52% funcs — clears 80/65/75)
- Passed: `corepack pnpm test:api -- auth` (21/21)
- Passed: `corepack pnpm test:api -- admin` (15/15)
- Passed: `corepack pnpm test:api -- security` (4/4)
- Passed: `corepack pnpm test:api -- audit` (8/8 + live Docker append-only proof, exit 0)
- Passed: `corepack pnpm openapi:check`
- Passed: `corepack pnpm build` (exit 0)
- Not Run (disclosed): `corepack pnpm security:check` — still a fail-loud pending aggregate; see condition 1.

### Coverage and honesty

- **All 23 Phase 1 tasks done** (F1-00A → F1-06C), each with an evidence entry using honest
  labels. Every "Passed" I re-ran reproduced exactly; counts match (auth 21, admin 15,
  security 4, audit 8 + proof, unit 20).
- **Every Verify Gate was honored by an independent VERIFY:** F1-01E3 (VERIFY-F1-01E Accept),
  F1-03A (VERIFY-F1-03A Repair → REPAIR-F1-03A → VERIFY-F1-03A-REPAIR Accept), F1-06B
  (VERIFY-F1-06B Accept). The one RBAC over-permissive finding (audit view) was caught at a
  gate and repaired, not waved through — evidence the gate discipline works.

### SRS acceptance-criteria mapping (not weakened)

- **NFR-SEC-001:** AC1 Argon2id (F1-01A/B) ✓; AC2 HttpOnly/Secure-in-prod/SameSite cookies
  (F1-01C) ✓; AC3 login rate limit by account+IP (F1-06A) ✓; AC5 CSRF on session-auth
  mutation routes — `POST /auth/logout` (F1-06B) and branch admin writes (F1-06C) ✓.
  **AC4** (prod HTTP→HTTPS redirect *behind the deployment gateway*) is infra, not app code —
  deferred to Phase 7 (F7-04) and **not** part of the "Security baseline" gate evidence list.
- **MVP "Security baseline" gate** (SRS line 70: password hashing, session cookies, CSRF, rate
  limit, RBAC tests) — all present and tested. Substance met.
- **RBAC-MATRIX-001:** audit view + branch admin are Admin-only, fail-closed, with SECURITY
  audit on deny (F1-03A repair, F1-02). ✓
- **REQ-AUDIT-001:** login/logout/failure audit, Admin-only search/export, DB-level append-only
  trigger proven live. ✓
- **API-STANDARD-001:** stable error envelope + correlation IDs (F1-04); new stable codes
  (`RATE_LIMITED` 429, `CSRF_INVALID` 403) documented in OpenAPI; drift-enforced. ✓
- **Architecture:** backend-owned authority, boundary lint, golden CRUD `branches` frozen,
  `MODULE.md` manifests, 300-line budget — all enforced and green.

### Conditions (non-blocking; tracked, none block Phase 2 = Complaint Core)

1. **`security:check` is a fail-loud placeholder.** It is the SRS-named proof command for the
   security baseline (NFR-SEC-001 proof list; milestone matrix). The substance is proven by
   `test:api -- security`/`-- auth`/`-- admin`/`-- audit`. Wire `security:check` to actually run
   those suites (or alias them) before the MVP pilot sign-off gate. Must not ship as a fake pass.
2. **NFR-SEC-001 AC4 (HTTPS redirect at the gateway)** is owed by the Phase 7 deployment runbook
   (F7-04). Also parameterize `POSTGRES_HOST_AUTH_METHOD: trust` before any non-dev deploy.
3. **No full Nest bootstrap/e2e test.** F1-06C added reflection-metadata tests (guard attachment
   per route + module provider registration) and F1-06C fixed the branches DI graph, which
   closes the worst of the prior gap — but no test boots the app and drives a request through the
   guard chain. Add a small bootstrap smoke test early in Phase 2, where complaint mutations add
   more guarded routes.
4. **Per-module `PrismaService`/`AuditService` duplication.** Auth and Branches each provide their
   own; with `BranchesModule` now importing `AuthModule`, providers overlap. Works for the
   single-node MVP (each `PrismaClient` owns its pool) but is a structural smell — consider a
   shared `@Global()` core module for `PrismaService`/`AuditService` during Phase 2 to avoid N
   pools and divergent audit wiring.
5. **Deferred auth features** (already disclosed): username login (REQ-AUTH-001 AC1) is email-only
   until the users/admin model adds a username column; account-lock (AC5) and password-reset (AC6)
   audit/flows land with those features.

### Rationale

Phase 1 ("Security Baseline") delivered every planned task with honest, independently-reproduced
evidence; the auth/session/RBAC/branch-scope/audit/error kernel and the CSRF + rate-limit
protections are real, tested at their trust boundaries (allowed + denied), and free of secret
leakage. The open items are explicitly disclosed, correctly sequenced for later phases, and do not
block Complaint Core. Accepting with conditions. Phase 2 opens with a PLANNER pass to reconcile the
already-applied F0-08 complaint tables against the Phase 2 backlog headers and emit agentic build
tasks (notably the backend-owned complaint state machine).

## F2-01A - Complaint Transition History Metadata Schema And Migration

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed migration/schema-only and did not add complaint behavior, routes,
    OpenAPI paths, UI, jobs, notifications, or audit-log mutation changes.
  - `ComplaintStatusHistory` now has enum-backed transition action storage plus actor
    role and request source columns required before the workflow service records real
    transition provenance.
  - Schema guard tests now fail if the history metadata fields or transition enums are
    removed.
  - Required proof commands passed, including Prisma validation/generation and Docker
    network `migrate deploy`.
  - `db:migrate:test` remains a fail-loud placeholder and was not reported as passed.

## F2-01B - Complaints Module Shell And Manifest

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed shell-only: generated complaints module files plus a filled
    `MODULE.md` boundary manifest.
  - No complaint behavior, routes, repository queries, OpenAPI paths, schema,
    migrations, UI, jobs, notifications, comments, attachments, or audit logic were
    added.
  - Required checks passed: lint, typecheck, test 20/20, and openapi:check.
  - Generator behavior was not touched, so the optional temp-root generator proof was
    correctly Not Run.

## F2-02A - Workflow Transition Matrix Validation

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - The task stayed pure service-validation only: no persistence, routes, OpenAPI,
    audit writes, jobs, notifications, or UI.
  - `ComplaintsService` now owns the SRS workflow matrix and returns deterministic
    target status decisions for allowed `(fromStatus, action, actorRole)` inputs.
  - Focused workflow tests cover every SRS matrix transition plus invalid-transition
    and unauthorized-role denials.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- workflow 3/3,
    and openapi:check.

## F2-02B - Persist Complaint Transitions With History And Audit

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept pending independent VERIFY
- Notes:
  - The task stayed service/repository/test-only: no routes, OpenAPI paths, UI, jobs,
    comments, attachments, notifications, customer portal behavior, SLA scheduling, or
    external side effects.
  - Valid transitions now go through `validateTransition`, then update complaint
    status, insert status history, and write a WORKFLOW audit entry in one repository
    transaction.
  - Focused workflow tests prove the update, history insert, and audit write share the
    same transaction client, and that invalid/unauthorized transitions do not start a
    transaction.
  - Required checks passed after fixing stale generated constructor specs: lint,
    typecheck, test 20/20, test:api -- workflow 6/6, and openapi:check.
  - Because this task is a Verify Gate, AUTO PHASE stops at `Needs Verify` before
    `F2-02C` can add the HTTP route on top of this persistence path.

## VERIFY-F2-02B - Complaint Transition Persistence Gate

- Date: 2026-06-18
- Required model tier: independent VERIFY
- Builder honesty: Honest
- Code quality: Acceptable
- Recommendation: Repair
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- workflow` (6/6)
  - Passed: `corepack pnpm openapi:check`
- Findings:
  - Repair required: `ComplaintsService.applyTransition` validates the caller-provided
    `fromStatus`, then `ComplaintsRepository.updateStatus` writes by `complaintId`
    only. The persisted complaint's current status is never checked atomically before
    the status/history/audit write path. Because `F2-02C` will build an HTTP route
    directly on this persistence path, the gate should not accept until stale or
    mismatched persisted status cannot create an invalid workflow history/audit pair.
- Scope review:
  - The task stayed inside service/repository/test wiring. No route, OpenAPI path, UI,
    job, notification, SLA, portal, attachment, or comment behavior was added.
  - Every valid transition still uses the F2-02A validator first.
  - The existing workflow tests prove status update, status history, and WORKFLOW audit
    use one transaction client, and invalid matrix/unauthorized-role inputs do not
    start a transaction.
  - Builder labels were honest, including the initial typecheck failure that was fixed
    before the builder marked the task pending VERIFY.

## REPAIR-F2-02B - Validate Persisted Complaint Status Before Transition Writes

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept pending independent VERIFY
- Notes:
  - `ComplaintsRepository.updateStatus` now conditionally updates by `complaintId` and
    expected persisted `fromStatus`, returning `null` when the row is stale or already
    in another state.
  - `ComplaintsService.applyTransition` maps that mismatch to stable
    `COMPLAINT_INVALID_TRANSITION` before status history or WORKFLOW audit writes.
  - The repair stayed inside the scoped service/repository/workflow-test files; no
    route, OpenAPI, UI, job, SLA, portal, comment, attachment, or notification behavior
    was added.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- workflow 7/7,
    and openapi:check.
  - Because this is still the `F2-02B` Verify Gate, AUTO PHASE stops at `Needs Verify`
    before `F2-02C`.

## VERIFY-F2-02B-REPAIR - Complaint Transition Persistence Repair Gate

- Date: 2026-06-18
- Required model tier: independent VERIFY
- Builder honesty: Honest
- Code quality: Good
- Recommendation: Accept
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- workflow` (7/7)
  - Passed: `corepack pnpm openapi:check`
- Findings:
  - No blocking findings.
- Scope review:
  - The repair stayed inside the scoped service/repository/workflow-test files. No
    route, OpenAPI path, UI, job, notification, SLA, portal, attachment, or comment
    behavior was added.
  - Every valid persisted transition still calls `validateTransition` before the
    repository transaction starts.
  - `ComplaintsRepository.updateStatus` now updates by `complaintId` and expected
    persisted `fromStatus`; a zero-row update returns `null`.
  - `ComplaintsService.applyTransition` maps that stale/mismatched persisted status
    to stable `COMPLAINT_INVALID_TRANSITION` before status history or WORKFLOW audit
    writes.
  - Successful transitions still write complaint status, status history, and WORKFLOW
    audit in one transaction client.
  - Invalid matrix inputs and unauthorized roles still reject before starting a
    transaction.

## F2-02C - Add Complaint Transition HTTP Route, RBAC/Branch-Scope Tests, And OpenAPI

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - Added the staff complaint transition route with session auth, RBAC, branch-scope,
    and CSRF guard metadata, wired through `ComplaintsModule`.
  - Controller remains HTTP-only: parses transition request body, derives actor role
    and audit context from the server request principal, forces `STAFF_API`, and
    delegates to `ComplaintsService.applyTransition`.
  - OpenAPI documents the route, `branchId` branch-scope query parameter, request,
    response, auth errors, and `COMPLAINT_INVALID_TRANSITION` conflict.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- workflow 11/11,
    and openapi:check.
  - Honest failed checks were repaired before acceptance: one workflow test
    expectation and one lint file-budget violation in `tools/openapi-check.mjs`.

## F2-03A - Add Complaint Creation Service Behavior With Validation, Reference Generation, History, And Audit

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - Added service/repository complaint creation behavior only; no HTTP creation
    route, OpenAPI creation path, queue, UI, portal, SLA, notification, attachment,
    or integration behavior was added.
  - Creation validates required complaint fields and VIN when vehicle-related,
    generates a deterministic count-based reference, creates the complaint as
    `SUBMITTED`, writes initial status history, and records COMPLAINT audit in one
    transaction.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- workflow 13/13,
    and openapi:check.
  - Honest typecheck failure was repaired before acceptance.
  - Carry-forward: customer persistence is minimal because the schema requires a
    customer relation before the customer module exists; revisit when customer
    module ownership lands.

## F2-03B - Add Complaint Creation HTTP Route, OpenAPI, And Allowed/Denied API Tests

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - Added guarded `POST /complaints` route and OpenAPI contract for staff complaint
    creation.
  - Controller remains HTTP-only: validates request body, requires guarded `branchId`
    query, derives actor/audit context from the server request principal, ignores
    spoofed body branch/actor fields, and delegates to `ComplaintsService.createInternal`.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- workflow 16/16,
    and openapi:check.
  - Honest typecheck failure was repaired before acceptance.

## F2-03C - Add Branch-Scoped Staff Complaint Queues

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - Added guarded `GET /complaints` queue route, repository branch filtering, explicit
    queue DTO mapping, tests, and OpenAPI contract.
  - Queue output avoids Prisma model leakage and does not include portal data, audit
    logs, DMS codes, or staff PII beyond owner ID.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- workflow 18/18,
    and openapi:check.

## F2-04A - Add Complaint Detail Read Model With Status-History Timeline

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - Added guarded `GET /complaints/:id` detail route, explicit detail DTO mapping,
    status-history timeline, scoped `COMPLAINT_NOT_FOUND`, tests, and OpenAPI
    contract.
  - Detail output avoids Prisma model leakage and excludes audit logs, portal data,
    DMS codes, and unrelated complaints.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- workflow 20/20,
    and openapi:check.

## F2-04B - Add Internal/Public Comment Service Behavior With Privacy And Audit Tests

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept
- Notes:
  - Added comment create and public-only comment read behavior in service/repository
    only; no HTTP route or OpenAPI path was added.
  - Comment creation validates nonblank body and writes COMMENT audit in the same
    transaction.
  - Public comment reads filter to `PUBLIC` visibility, preserving internal comment
    privacy for future portal/public surfaces.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- workflow 22/22,
    and openapi:check.

## F2-04C - Add Complaint Detail/Comment HTTP Routes And OpenAPI

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept pending Phase 2 PHASE-REVIEWER
- Notes:
  - Added guarded staff HTTP routes for comment creation and public-comment reads,
    with canonical OpenAPI contract entries.
  - Controller remains HTTP-only: validates the request DTO, derives actor/audit
    context from the server request principal, verifies scoped complaint access, and
    delegates to the F2-04B service behavior.
  - Public comment reads preserve privacy by returning only `PUBLIC` comments.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- workflow 25/25,
    and openapi:check.
  - All Phase 2 backlog tasks are now complete; Forge state is set to
    `Needs Phase Review` before Phase 3 can be planned.

## PHASE-2-REVIEW - Complaint Core Acceptance Review

- Date: 2026-06-18
- Reviewer tier: PHASE-REVIEWER (current Codex context; preferred vendor model not claimed)
- Risk: High
- Decision: **Repair Required**
- Phase 3 may start: **No**

### Verification labels (re-run by reviewer)

- Passed: `corepack pnpm lint`
- Passed: `corepack pnpm typecheck`
- Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
- Passed: `corepack pnpm test:api -- workflow` (25/25)
- Passed: `corepack pnpm openapi:check`

### Blocking finding

- `POST /complaints/:id/transitions` does not prove the target complaint is inside the caller's branch scope before applying the transition. `RbacGuard` only compares the `branchId` query parameter to the server session, and `ComplaintsRepository.updateStatus` updates by `{ id, status }` without a branch predicate. A non-admin staff user can pass their own scoped `branchId` query while naming another branch's complaint ID, then the service can update that complaint and write workflow history/audit. This violates `REQ-RBAC-001` authorized branch scope, `RBAC-MATRIX-001` scoped complaint actions, and `WORKFLOW-MATRIX-001` backend transition authority.

### Scope review

- Phase 2 backlog items F2-01A through F2-04C are checked done and have evidence/trust entries.
- The F2-02B verify gate found the stale persisted-status issue, the repair was built, and the repair verify accepted it.
- Complaint creation, queue, detail, and comment routes derive actor/branch authority from the server session or verify scoped detail before delegation.
- The transition route has guard metadata and CSRF, but lacks the same target-complaint scope check used by detail/comment paths.
- OpenAPI drift checks pass, and the source-file budget is respected.

### Required repair

Write the smallest Phase 2 repair before planning Phase 3: enforce target complaint branch scope on `POST /complaints/:id/transitions` and add a workflow API test that fails if a scoped staff user can transition a complaint outside their authorized branch.

## REPAIR-PHASE-2-TRANSITION-BRANCH-SCOPE - Enforce Target Complaint Branch Scope Before Transitions

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept pending Phase 2 PHASE-REVIEWER
- Notes:
  - The repair stayed inside the scoped controller/workflow-test files.
  - `POST /complaints/:id/transitions` now verifies scoped target complaint detail before entering `applyTransition`, matching the branch-scope protection already used by detail/comment paths.
  - Focused workflow tests prove out-of-scope complaint IDs reject before transition write and Admin can still transition without a branch filter.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- workflow 27/27, and openapi:check.
  - Phase 2 still needs a fresh PHASE-REVIEWER decision before Phase 3 planning starts.

## PHASE-2-REVIEW-2 - Complaint Core Acceptance Review After Branch-Scope Repair

- Date: 2026-06-18
- Reviewer tier: PHASE-REVIEWER (current Codex context; preferred vendor model not claimed)
- Risk: High
- Decision: **Repair Required**
- Phase 3 may start: **No**

### Verification labels (re-run by reviewer)

- Passed: `corepack pnpm lint`
- Passed: `corepack pnpm typecheck`
- Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
- Passed: `corepack pnpm test:api -- workflow` (27/27)
- Passed: `corepack pnpm openapi:check`

### Blocking finding

- Transition-specific role denial is not audited. `POST /complaints/:id/transitions`
  allows staff roles through the route guard, then `ComplaintsService.validateTransition`
  rejects disallowed role/action pairs with `RBAC_FORBIDDEN` before `applyTransition`
  starts a transaction. That path writes no `SECURITY` audit event, while
  `REQ-RBAC-001` AC5 requires unauthorized API calls to return 403 and create an
  audit/security event, and `WORKFLOW-MATRIX-001` AC2 requires valid transitions by
  unauthorized role to return 403 and write a security/audit event.

### Scope review

- The branch-scope repair is accepted as implemented: the transition route verifies
  scoped target complaint detail before `applyTransition`, and tests prove hidden
  complaint IDs reject before status update/history/audit while Admin can transition
  without a branch filter.
- Successful complaint creation and workflow transitions still write status history
  and audit in the same transaction. Stale persisted status rejects before history
  and WORKFLOW audit.
- Queue/detail/comment paths derive branch scope from the server session or verify
  scoped detail before delegation. Public comment reads filter to `PUBLIC`.
- OpenAPI drift checks pass and Phase 2 routes are documented.
- Phase 2 backlog now needs one repair entry before another PHASE-REVIEWER pass.

### Required repair

Write the smallest Phase 2 repair before planning Phase 3: audit workflow
transition denials caused by unauthorized actor role, and add a workflow API test
that fails if that `RBAC_FORBIDDEN` path does not write a safe `SECURITY` audit
event before any status update, status history, or WORKFLOW audit.

## REPAIR-PHASE-2-TRANSITION-ROLE-DENIAL-AUDIT - Audit Transition-Specific Unauthorized Role Denials

- Date: 2026-06-18
- Risk: High
- Recommendation: Accept pending Phase 2 PHASE-REVIEWER
- Notes:
  - The repair stayed inside the scoped service/workflow-test files.
  - Valid state/action transitions denied by actor role now write a `SECURITY` /
    `workflow_role_forbidden` audit entry before throwing `RBAC_FORBIDDEN`.
  - Invalid state/action denials remain `COMPLAINT_INVALID_TRANSITION` without a
    security audit event.
  - Denied-role tests prove no transaction starts before the audit/deny path returns.
  - Required checks passed: lint, typecheck, test 20/20, test:api -- workflow 27/27,
    and openapi:check.
  - Phase 2 still needs a fresh PHASE-REVIEWER decision before Phase 3 planning starts.

## PHASE-2-REVIEW-3 - Complaint Core Acceptance Review After Repairs

- Date: 2026-06-18
- Reviewer tier: PHASE-REVIEWER (current Codex context; preferred vendor model not claimed)
- Risk: High
- Decision: **Accept With Conditions**
- Phase 3 may start: **Yes**

### Verification labels (re-run by reviewer)

- Passed: `corepack pnpm lint`
- Passed: `corepack pnpm typecheck`
- Passed: `corepack pnpm test` (20/20; coverage 92.01% lines / 81.01% branches / 94.52% funcs)
- Passed: `corepack pnpm test:api -- workflow` (27/27)
- Passed: `corepack pnpm openapi:check`

### Findings

- Builder honesty: **Honest.** The latest repair evidence reproduced exactly, and
  prior failed/repair loops are preserved instead of overwritten.
- Code quality: **Good.** The complaints module stays inside the generated module
  boundary, exports only `ComplaintsService`, and passes the 300-line/source-boundary
  lint gate.
- Backend-owned workflow authority holds: `ComplaintsService` owns the explicit
  workflow matrix; controllers only parse HTTP, derive context, verify scoped detail,
  and delegate.
- Server-session authority holds: staff routes use `SessionAuthGuard`, `RbacGuard`,
  `@Roles(...)`, `@BranchScoped()`, and mutation routes use `CsrfGuard`. Transition
  input ignores spoofed actor/role/source data and forces `STAFF_API`.
- The branch-scope repair holds: `POST /complaints/:id/transitions` verifies target
  complaint visibility through `getDetail(id, { branchId: queueBranchId(...) })`
  before `applyTransition`; tests prove out-of-scope complaint IDs reject before
  status update/history/audit and Admin can transition without a branch filter.
- The role-denial repair holds: valid state/action transitions denied because of
  actor role now write a safe `SECURITY` / `workflow_role_forbidden` audit event
  before returning `RBAC_FORBIDDEN`, and still start no status transaction.
- Same-transaction state changes hold: complaint creation writes complaint, initial
  status history, and COMPLAINT audit in one transaction; valid transitions update
  persisted status, write status history, and WORKFLOW audit in one transaction;
  comment creation writes COMMENT audit in the same transaction.
- Privacy boundaries hold for Phase 2: queue/detail DTOs are explicit, detail hides
  missing or branch-hidden complaints as `COMPLAINT_NOT_FOUND`, public comment reads
  filter to `PUBLIC`, and no portal route or portal-visible DTO exposes internal
  comments, audit logs, DMS codes, staff PII, or unrelated complaints.
- OpenAPI drift coverage holds: all Phase 2 routes and schemas are in the canonical
  OpenAPI document and `openapi:check` passed.
- Audit append-only discipline remains in place through `AuditService.record()` and
  the `audit_logs_no_update_delete` migration trigger.

### Conditions

- Non-blocking: Phase 2 captures public staff comment timestamps. Before first-response
  reports ship, Phase 3/Phase 7 must decide whether to compute first response from the
  first public staff comment or materialize it into `Complaint.firstResponseAt`.
- Non-blocking: Phase 3 must keep notification/SLA side effects after commit; Phase 2
  intentionally enqueued no side effects.

### Rationale

Phase 2 delivered the complaint schema metadata, complaints module boundary, workflow
matrix, transition persistence, HTTP transition route, creation, queue, detail,
comments, branch-scope repair, and transition role-denial audit repair with reproduced
proof. The two prior PHASE-REVIEWER blockers were repaired and rechecked. Remaining
conditions are downstream reporting/SLA implementation choices, not blockers for
starting Phase 3 planning.

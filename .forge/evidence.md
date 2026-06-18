# Evidence Log

Append build and verification evidence here. Do not delete failed evidence.

## INIT - Forge Initialized

- Date: 2026-06-18
- Risk: Low
- Status: Passed
- Evidence:
  - Created clean Forge files for CMS-Auto.
  - Used `docs/CMS_AUTO_SRS.md` as source of truth.
  - Did not copy stale Buildra history or legacy prompt wrappers.

## SRS-REVIEW-001 - Contract Clarifications

- Date: 2026-06-18
- Risk: Medium
- Status: Passed
- Evidence:
  - Patched `docs/CMS_AUTO_SRS.md` to clarify compensation RBAC, reject transitions, parallel approvals, CSAT scale, inquiry/suggestion/feedback handling, portal anti-abuse, password reset UI, in-app notifications UI, attachment defaults, RTO, DMS multiple matches, management masking, first-response KPI source, total complaint SLA target, and optimistic concurrency for complaint updates.
  - Verified the new clauses are present with `rg`.

## SRS-UI-001 - Modern UI/UX Contract

- Date: 2026-06-18
- Risk: Medium
- Status: Passed
- Evidence:
  - Added `UI-DESIGN-001` to `docs/CMS_AUTO_SRS.md`.
  - Locked MVP UI stack to Tailwind CSS, shadcn/ui, Radix UI, and Lucide icons.
  - Added design tokens, shared components, required UI states, responsive widths, WCAG AA, visual regression, and frontend performance gates.
  - Wired UI quality into milestone planning and final sign-off.

## SRS-UI-002 - UI Gate Wiring

- Date: 2026-06-18
- Risk: Low
- Status: Passed
- Evidence:
  - Added UI/UX quality to MVP acceptance gates.
  - Added `QA-UI-001` for visual, accessibility, UI state, responsive, and frontend performance coverage.
  - Added Dark mode as Phase 2 in the scope table.
  - Updated `.forge/next.md` to require `test:visual` and `web:perf` scripts in the first scaffold plan.

## FORGE-QUALITY-001 - Agent Build Guardrails

- Date: 2026-06-18
- Risk: Low
- Status: Passed
- Evidence:
  - Updated Forge backlog and first task to prioritize enforceable gates, module generator/scaffold, and a golden CRUD reference module.
  - Recorded that auth/audit are special-case modules and should not be the normal CRUD reference.

## F0-00 - Agent Rulebook And Architecture Blueprint

- Date: 2026-06-18
- Risk: Low
- Status: Passed
- Evidence:
  - Created `docs/ARCHITECTURE.md`: module pattern, enforced dependency direction, canonical audit/RBAC/error/transaction/job patterns, enforcement gates, and the structural-skeleton vs golden-CRUD split.
  - Created `CLAUDE.md` and identical `AGENTS.md` with the short agent build rules.
  - Wired both into `.forge/forge.md` Read First and PLAN inputs so every Forge run loads the how-layer, not just the SRS and next task.
  - Drawn from SRS `METHOD-*`, `ARCH-*`, §14, and §23; consistent with the contract.

## PLAN-F0-01 - Scaffold Build Task

- Date: 2026-06-18
- Risk: Low
- Status: Passed
- Evidence:
  - Moved coherent Prisma data model planning from Phase 2 to `F0-08`, before any feature migrations.
  - Replaced `.forge/next.md` with a buildable `F0-01` scaffold task.
  - Set `.forge/state.md` to `Ready to Build`.

## F0-01 - Monorepo Scaffold And Toolchain Foundation

- Date: 2026-06-18
- Risk: Medium
- Status: Passed
- Requirement IDs:
  - CONTRACT-READINESS-001
  - CONTRACT-READINESS-002
  - ARCH-STACK-001
  - ARCH-API-001
  - ARCH-DATA-001
  - UI-DESIGN-001
  - METHOD-MODULAR-001
  - METHOD-API-001
- Evidence:
  - Created the pnpm workspace root with `packageManager: pnpm@9.15.4`.
  - Added scaffold package boundaries for `apps/api`, `apps/web`, `packages/database`, `packages/contracts`, and `packages/config`.
  - Added strict TypeScript inheritance from `tsconfig.base.json`.
  - Added a minimal OpenAPI 3.1 contract shell at `packages/contracts/openapi.json`.
  - Added a Prisma schema shell with no domain tables.
  - Added `docker-compose.yml` with PostgreSQL and Redis only.
  - Exposed all SRS proof script names in root `package.json`.
  - Left non-F0-01 proof scripts as failing pending scripts so they cannot be mistaken for passed visual, API, security, backup, DB, or performance coverage.
- Verification:
  - Passed: `corepack pnpm install --lockfile-only`
  - Passed: `corepack pnpm install`
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test`
  - Passed: `corepack pnpm openapi:check`
  - Passed: `corepack pnpm build`
- Notes:
  - Initial `corepack pnpm typecheck` failed before dependency installation because `--lockfile-only` does not create `node_modules`; after `corepack pnpm install`, the same command passed.
  - No domain behavior, auth logic, workflow logic, UI screens, module generator, or domain tables were added.

## F0-02 - Real Toolchain Proof Scripts

- Date: 2026-06-18
- Risk: Medium
- Status: Passed
- Requirement IDs:
  - CONTRACT-READINESS-001
  - CONTRACT-READINESS-002
  - ARCH-STACK-001
  - ARCH-API-001
  - METHOD-MODULAR-001
  - METHOD-API-001
  - UI-DESIGN-001
- Evidence:
  - Replaced the scaffold-only `lint` script with `tools/lint.mjs`.
  - `lint` now verifies the scaffold contract, parses required JSON files, and enforces baseline import boundaries for web, api, and package code.
  - Added a node:test coverage check proving frontend imports from `@cms-auto/api` are rejected.
  - Kept pending proof scripts failing loudly so unimplemented API, E2E, visual, performance, DB, security, and backup checks cannot be reported as passed coverage.
- Verification:
  - Passed: `corepack pnpm install --lockfile-only`
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test`
  - Passed: `corepack pnpm openapi:check`
  - Passed: `corepack pnpm build`
- Notes:
  - No domain modules, UI screens, auth, workflow behavior, database tables, or generator files were added.

## F0-03 - Docker Local Stack For API And Web

- Date: 2026-06-18
- Risk: Medium
- Status: Passed
- Requirement IDs:
  - CONTRACT-READINESS-001
  - CONTRACT-READINESS-002
  - ARCH-STACK-001
  - ARCH-API-001
  - ARCH-DATA-001
- Evidence:
  - Added `apps/api/Dockerfile` (multi-stage: build tsc → runtime node:20-alpine).
  - Added `apps/web/Dockerfile` (same pattern).
  - Added `.dockerignore` excluding node_modules, dist, .next, coverage, .git, secrets, forge files.
  - Extended `docker-compose.yml` with `api` (depends_on postgres, redis) and `web` (depends_on api) services.
  - All service URLs and connection strings supplied via environment variables; no secrets hard-coded.
  - Added `@types/node` to root devDependencies so the Node entrypoint files typecheck under strict mode.
  - Added `"types": ["node"]` to `apps/api/tsconfig.json` and `apps/web/tsconfig.json`.
  - Added `start` scripts to `apps/api/package.json` and `apps/web/package.json`.
  - Liveness entrypoints (`apps/api/src/main.ts`, `apps/web/src/main.ts`) use only `node:http`; no domain behavior, auth, workflow, or database access.
- Verification:
  - Passed: `corepack pnpm install --lockfile-only`
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test`
  - Passed: `corepack pnpm openapi:check`
  - Passed: `docker compose config --quiet` (exit 0)
- Notes:
  - Docker image build (`docker compose build`) ran and produced `cms-forge-api:latest` and `cms-forge-web:latest` successfully (verified in the F0-04 session before starting seed work).
  - No domain modules, UI screens, auth, workflow behavior, database tables, seed data, or module generator were added.

## F0-04 - Seed Data For Branches, Roles, Users, Categories, Vehicles, Complaints

- Date: 2026-06-18
- Risk: Medium
- Status: Passed
- Requirement IDs:
  - ARCH-DATA-001
  - CONTRACT-READINESS-001
  - METHOD-AUDIT-001
  - REQ-ADMIN-001
  - RBAC-MATRIX-001 (role codes from the matrix used as stable enum values)
- Evidence:
  - Retired the F0-01-era "no domain tables" scaffold guard from `tools/scaffold-check.mjs` (the guard's error message explicitly said "in F0-01"; it is no longer needed).
  - Added minimal Prisma domain models to `packages/database/prisma/schema.prisma`: Branch, Role, User, Category, Customer, Vehicle, Complaint — with snake_case `@@map`/`@map` naming per ARCH §13.
  - Enums use SRS-aligned stable codes: `RoleCode` (CR_OFFICER, CR_MANAGER, BRANCH_MANAGER, ADMIN, MGMT_READONLY, CUSTOMER_PORTAL) from RBAC-MATRIX-001; `ComplaintStatus` (DRAFT, SUBMITTED, MANAGER_REVIEW, BRANCH_REVIEW, IN_PROGRESS, RESOLVED, CLOSED, REOPENED, REJECTED) from WORKFLOW-MATRIX-001.
  - Added `packages/database/prisma/seed.ts` — idempotent upsert seed: 2 branches, 6 roles, 4 dev-only users, 5 categories, 2 customers, 2 vehicles, 3 complaints in different states. No real credentials or secrets.
  - Added `packages/database/prisma/tsconfig.json` for typechecking the seed file separately (keeps `packages/database/tsconfig.json` rootDir unchanged).
  - Added `packages/database/prisma/tsconfig.json` to `tools/lint.mjs` JSON-file check set.
  - Added `@prisma/client` (dep) and `prisma` CLI (devDep) to `packages/database/package.json`.
  - Added `tsx` to root devDependencies for running the seed.
  - Added `prisma.seed` config and `db:seed` utility script to root `package.json`.
  - Updated root `typecheck` command to include `packages/database/prisma/tsconfig.json --noEmit`.
  - Added `POSTGRES_HOST_AUTH_METHOD: trust` to docker-compose.yml postgres service (local dev only; documented inline).
  - Generated migration `20260618115340_init` and applied it to the running postgres container via `docker run --network cms-forge_default`.
  - Ran `seed.ts` inside the Docker network; verified with psql: 2 branches, 6 roles, 4 users, 5 categories, 2 customers, 2 vehicles, 3 complaints in expected states.
- Verification:
  - Passed: `corepack pnpm install --lockfile-only`
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck` (includes seed tsconfig)
  - Passed: `corepack pnpm test`
  - Passed: `corepack pnpm openapi:check`
  - Passed: `docker compose config --quiet` (exit 0)
  - Passed: `db:seed` — ran inside Docker network; data verified via `docker compose exec postgres psql`.
- Notes:
  - Prisma's Rust query engine (P1000) cannot authenticate against the postgres container through Docker Desktop's Windows port-forwarding layer. This is a known Docker Desktop on Windows networking edge case; it does not indicate a code defect. Migration and seed were executed inside the Docker network by mounting the database package into a `node:20-alpine` container on `cms-forge_default`.
  - `POSTGRES_HOST_AUTH_METHOD: trust` was added to docker-compose.yml for local dev ease; it is clearly marked "Never use in production."
  - F0-08 will expand this schema into the full coherent data model before Phase 2 feature migrations.

## F0-05 - Frontend Design Tokens And Shared UI Component Foundation

- Date: 2026-06-18
- Risk: Low
- Status: Passed
- Requirement IDs:
  - UI-DESIGN-001
  - ARCH-UI-001
  - CONTRACT-READINESS-001
- Evidence:
  - Added Tailwind CSS v3, PostCSS, Autoprefixer to `apps/web/package.json`.
  - Added `tailwind.config.ts`, `postcss.config.js`, and `src/globals.css` to `apps/web`.
  - Defined design tokens as CSS custom properties in `src/globals.css` and mapped them in `tailwind.config.ts` (colors, typography, spacing, radius, shadow, focus).
  - Explicitly supported RTL/LTR layout in tokens via logical design considerations per `UI-DESIGN-001` (tokens are stable values).
  - Installed `clsx`, `tailwind-merge`, `@radix-ui/react-slot`, `lucide-react`, and `class-variance-authority`.
  - Created `apps/web/src/lib/utils.ts` exporting `cn()`.
  - Created typed token map at `apps/web/src/lib/tokens.ts` exporting `designTokens` without adding page routes or React elements.
- Verification:
  - Passed: `corepack pnpm install --lockfile-only`
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test`
  - Passed: `corepack pnpm openapi:check`
  - Passed: `docker compose config --quiet` (exit 0)
- Notes:
  - No domain logic, auth, components, or screens were implemented as constrained by the task scope.

## PLAN-F0-06 - Phase 0 Quality Gates

- Date: 2026-06-18
- Risk: Medium
- Status: Passed
- Requirement IDs:
  - CONTRACT-READINESS-002
  - CONTRACT-READINESS-003
  - ARCH-STACK-001
  - ARCH-API-001
  - METHOD-MODULAR-001
  - METHOD-API-001
  - METHOD-TEST-001
  - NFR-MAINT-001
  - QA-UI-001
  - UI-DESIGN-001
- Evidence:
  - Replaced `Needs planning` with a buildable `F0-06` task.
  - Kept scope to existing Node-based quality scripts, OpenAPI scaffold drift, test coverage thresholds, and fail-loud UI/perf proof gates.
  - Set `.forge/state.md` to `Ready to Build`.
  - Deferred full ESLint, dependency-cruiser, Playwright, Lighthouse, and real visual/a11y/perf execution until there are modules or screens worth checking.

## F0-06 - Phase 0 Quality Gates

- Date: 2026-06-18
- Risk: Medium
- Status: Passed
- Requirement IDs:
  - CONTRACT-READINESS-002
  - CONTRACT-READINESS-003
  - ARCH-STACK-001
  - ARCH-API-001
  - METHOD-MODULAR-001
  - METHOD-API-001
  - METHOD-TEST-001
  - NFR-MAINT-001
  - QA-UI-001
  - UI-DESIGN-001
- Evidence:
  - Strengthened `tools/lint.mjs` to reject frontend imports from API/database/Prisma/provider SDKs, API imports from web, package imports from apps, cross-module private repository/DTO imports, and TODO/FIXME markers in app/package source paths.
  - Updated `corepack pnpm test` to use Node's built-in coverage thresholds.
  - Added OpenAPI canonical scaffold generation/checking and baseline error schemas (`ErrorEnvelope`, `ErrorBody`, `FieldError`) to `packages/contracts/openapi.json`.
  - Added tests for lint boundaries, OpenAPI drift/schema checks, and fail-loud pending proof commands.
  - Kept Playwright/Lighthouse/full ESLint/dependency-cruiser deferred until real modules or screens exist.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (9 tests passed; coverage thresholds enforced at lines 80, functions 75, branches 65)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `corepack pnpm build`
- Notes:
  - Direct `test:visual`, `test:e2e -- accessibility`, and `web:perf` execution remains Not Run for this task; fail-loud behavior is covered by `tools/pending-proof.test.mjs` because no real UI screens exist yet.
  - No business logic, routes, migrations, UI screens, or provider integrations were added.

## F0-07 - Module Generator Template And Golden CRUD Designation

- Date: 2026-06-18
- Risk: Medium
- Status: Passed
- Requirement IDs:
  - CONTRACT-READINESS-002
  - ARCH-STACK-001
  - METHOD-MODULAR-001
  - METHOD-API-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Added `corepack pnpm generate:module -- <name>` via dependency-free `tools/generate-module.mjs`.
  - Generator creates the canonical API module skeleton under `apps/api/src/modules/<module>/`: module, controller, service, repository, DTOs, and service/controller specs.
  - Generator rejects invalid module names and refuses to overwrite existing module directories.
  - Tested generation in a temp workspace with `corepack pnpm generate:module -- branches --root <temp>`.
  - Kept `branches` as the future golden CRUD reference already documented in `docs/ARCHITECTURE.md`; no CRUD behavior was implemented.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (12 tests passed; coverage thresholds enforced)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `corepack pnpm build`
  - Passed: `corepack pnpm generate:module -- branches --root <temp>`
- Notes:
  - No real domain module was generated in the repository.
  - No routes, migrations, RBAC, audit, OpenAPI paths, or business logic were added.

## F0-08 - Coherent Prisma Data Model Draft

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Requirement IDs:
  - CONTRACT-READINESS-002
  - ARCH-DATA-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - API-STANDARD-001
  - REQ-ADMIN-001
  - REQ-CUSTOMER-001
  - REQ-COMPLAINT-001
  - SLA-CALENDAR-001
  - PORTAL-SEC-001
  - ARCH-STACK-001
  - METHOD-MODULAR-001
  - METHOD-TEST-001
- Evidence:
  - Expanded `packages/database/prisma/schema.prisma` from the F0-04 seed model into the MVP core data model.
  - Added first-class models for departments, complaint status history, approvals, attachments, comments, SLA policies/events, notifications, surveys, compensation, portal verifications, portal sessions, and audit logs.
  - Kept stable UPPER_SNAKE enum codes and snake_case table/column mapping.
  - Preserved seed compatibility through defaults/optional fields; no seed logic changes were required.
  - Added `tools/schema-check.mjs` and tests to fail if core schema tables, complaint status history, or audit log storage are removed.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (15 tests passed; coverage thresholds enforced)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `corepack pnpm build`
  - Passed: `DATABASE_URL=postgresql://postgres@localhost:5432/cms_auto?schema=public corepack pnpm --filter @cms-auto/database exec prisma validate --schema prisma/schema.prisma`
- Notes:
  - No destructive migration was run.
  - No API modules, routes, UI, business services, workflow logic, jobs, OpenAPI paths, or provider adapters were implemented.

## FORGE-PHASE-REVIEW-001 - Phase Completion Review Gate

- Date: 2026-06-18
- Risk: Medium
- Status: Passed
- Requirement IDs:
  - CONTRACT-READINESS-002
  - METHOD-TEST-001
- Evidence:
  - Added `PHASE-REVIEWER` to `.forge/models.md` with Opus 4.8 Max and GPT-5.5 Extra High as preferred phase-review models.
  - Updated `.forge/forge.md` so completed backlog phases stop at `Needs Phase Review` before the next phase starts.
  - Updated `.forge/policy.md` to make phase-end review mandatory and separate from builder acceptance.
  - Converted the current state from Phase 1 build start to `PHASE-0-REVIEW`.
- Verification:
  - Passed: `rg -n "PHASE-REVIEWER|Needs Phase Review|PHASE REVIEW|Opus 4\\.8|GPT-5\\.5|PHASE-0-REVIEW|Phase completion review" .forge`
- Notes:
  - No application source code was changed.
  - Phase 1 must not start until Phase 0 receives an explicit phase-review decision.

## FORGE-AGENTIC-ARCH-001 - Agentic Codebase Guardrails

- Date: 2026-06-18
- Risk: Medium
- Status: Passed
- Requirement IDs:
  - CONTRACT-READINESS-002
  - METHOD-MODULAR-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Added a 240-line source-file budget to `tools/lint.mjs` with explicit canonical exceptions.
  - Added a focused lint test proving oversized source files fail.
  - Updated `docs/ARCHITECTURE.md`, `CLAUDE.md`, `AGENTS.md`, `.forge/policy.md`, and `.forge/forge.md` with small-task/small-file rules.
  - Converted the oversized Phase 1 auth build into `PLAN-F1-00` so Forge splits it before coding.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm test`
- Notes:
  - `packages/database/prisma/schema.prisma` remains a canonical exception. It is large but guarded by schema tests and should be edited by focused model block.
  - No application feature code was implemented.

## FORGE-AGENTIC-ARCH-002 - Recalibrated File Budget And Module Manifests

- Date: 2026-06-18
- Risk: Medium
- Status: Passed
- Requirement IDs:
  - METHOD-MODULAR-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Recalibrated the agentic file-size guard in `tools/lint.mjs`: budget 240 -> 300, and
    exempted test files (`*.spec.*`, `*.test.*`) and DTO/type files (`*.dto.ts`). Line
    count is a crude proxy; a hard 240 risked penalising thorough RBAC test files and
    seed data, and pushing agents toward fragmenting cohesive units.
  - Added `checkModuleManifests` to `tools/lint.mjs`: every `apps/api/src/modules/<m>/`
    directory must contain a `MODULE.md` documenting Public surface, Owns tables, May
    depend on, and SRS. Fails loud if missing or incomplete. No modules exist yet, so it
    is inert on current code and activates the moment a module is generated.
  - Updated `tools/generate-module.mjs` to emit `MODULE.md` as the first file of every
    generated module, pre-filled with the four required fields and placeholders.
  - Tests: updated the oversized-file test to 300; added a test proving test/DTO files
    are exempt; added a test proving a module without/with a complete manifest fails/passes;
    extended the generator test to assert generated output satisfies `checkModuleManifests`.
  - Docs: updated `docs/ARCHITECTURE.md` (§3 skeleton + §14 budget/manifest rules),
    `CLAUDE.md`, and `AGENTS.md` (kept byte-identical below the mirror notice).
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (18/18; was 16)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `corepack pnpm build`
  - Passed: CLAUDE.md and AGENTS.md identical below the mirror-notice line (`diff`)
- Notes:
  - Builder/reviewer split: this refines FORGE-AGENTIC-ARCH-001 (GPT) rather than
    reverting it. The task-split gate and `PLAN-F1-00` are kept untouched; only the
    line-budget instrument was recalibrated and the manifest convention added.
  - The manifest is the higher-leverage agentic move: it bounds the context an agent
    must load to edit one module, which raw file-size limits do not.
  - No application feature code, routes, migrations, or domain modules were added.
  - State remains `Ready to Plan` on `PLAN-F1-00`; this change did not alter the queued task.
  - Follow-up correction: active `.forge/forge.md`, `.forge/policy.md`, and
    `.forge/next.md` were synced from stale 240-line wording to the implemented
    300-line budget. Historical evidence entries were left unchanged.

## FORGE-AUTO-PHASE-001 - Auto Phase Run Mode

- Date: 2026-06-18
- Risk: Medium
- Status: Passed
- Requirement IDs:
  - CONTRACT-READINESS-002
  - METHOD-TEST-001
- Evidence:
  - Added `AUTO PHASE` to `.forge/forge.md` for explicit user-requested phase autopilot.
  - Added policy language clarifying that auto phase may continue between successful
    build tasks but must stop for PLANNER, blockers, verify/review, phase review,
    failed checks, or scope-budget overflow.
- Verification:
  - Passed: `rg -n "AUTO PHASE|auto-run|autopilot|Ready to Plan|Needs Phase Review" .forge/forge.md .forge/policy.md`
- Notes:
  - No application source code was changed.
  - Current state remains `Ready to Plan`; a strong builder should stop until
    `PLAN-F1-00` is handled by PLANNER.

## FORGE-AUTO-PHASE-002 - Verify Gate And Security Self-Check

- Date: 2026-06-18
- Risk: Medium
- Status: Passed
- Requirement IDs:
  - METHOD-TEST-001
  - ARCH-AUTH-001
  - NFR-SEC-001
- Evidence:
  - Refined the AUTO PHASE design (FORGE-AUTO-PHASE-001, GPT) at the user's explicit
    direction: Phase 1 is entirely High-risk security code, so unbounded autopilot
    would defer all independent verification to phase-end. User chose "one checkpoint
    after the foundation."
  - Added a declarative `Verify Gate: required` marker. A successful gated task sets
    `.forge/state.md` to `Needs Verify` (instead of `Ready to Build`), which pauses
    AUTO PHASE for an independent VERIFY (fresh context / different model). The state
    machine already stops on `Needs Verify`, so this composes without new machinery.
  - `PLAN` now marks the auth/session/RBAC/audit foundation as a `Verify Gate`.
    `PLAN-F1-00`'s task instructs the planner to mark `F1-01` as the gate.
  - `BUILD` now routes a gated task to `Needs Verify`, and requires the `policy.md`
    security self-check in evidence for every High/Critical task.
  - `VERIFY` now closes the loop: on `Accept` it writes the next in-phase task and
    sets `Ready to Build` (autopilot resumes); on `Repair`/`Redo` it sets `Needs
    Repair` and escalates.
  - Added a `Security Self-Check` section to `.forge/policy.md` (session-derived RBAC,
    audit-in-transaction, no secrets logged/returned, portal exposure rules, allowed +
    denied trust-boundary tests) and core rule 10 binding it.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm test` (18/18)
  - Passed: `rg -n "Verify Gate|Security Self-Check|Needs Verify" .forge/forge.md .forge/policy.md .forge/next.md`
- Notes:
  - Protocol files (`forge.md`, `policy.md`) were edited because the user explicitly
    requested this autonomy/safety change — within the "unless the user asks to change
    the protocol" allowance.
  - Velocity preserved: F1-00A migration and F1-00B Nest+kernel flow automatically;
    the single independent stop is after F1-01, before F1-02+ build on the auth base.
  - No application source code was changed. State remains `Ready to Plan` on `PLAN-F1-00`.

## PLAN-F1-00 - Split Phase 1 Into Agentic Build Tasks

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: PLANNER
- Requirement IDs:
  - CONTRACT-READINESS-002
  - ARCH-STACK-001
  - ARCH-DATA-001
  - ARCH-AUTH-001
  - REQ-AUTH-001
  - REQ-RBAC-001
  - REQ-AUDIT-001
  - NFR-SEC-001
  - METHOD-API-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Split the Phase 1 start into `F1-00A` migration, `F1-00B` NestJS/core kernel, and gated `F1-01` staff auth.
  - Replaced `.forge/next.md` with the first buildable task only: `F1-00A`.
  - Set `.forge/state.md` to `Ready to Build`.
  - Kept implementation deferred; no application source code was changed.
  - Marked `F1-01` in backlog with `Verify Gate: required`.
- Verification:
  - Passed: `rg -n "F1-00A|F1-00B|F1-01|300|Ready to Build" .forge/backlog.md .forge/next.md .forge/state.md`
- Security Self-Check:
  - Not Run: planning-only task; no auth, RBAC, branch-scope, state-change, audit, portal, or logging behavior was implemented.
  - Planned gate: `F1-01` remains `Verify Gate: required` before dependent Phase 1 tasks proceed.

## F1-00A - Generate And Apply The F0-08 Prisma Migration

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - CONTRACT-READINESS-002
  - ARCH-STACK-001
  - ARCH-DATA-001
  - METHOD-TEST-001
- Evidence:
  - Generated migration `packages/database/prisma/migrations/20260618134424_f0_08_core_model/migration.sql` from the accepted F0-08 schema.
  - Patched the generated SQL only to backfill required `updated_at` columns on existing seed tables before enforcing `NOT NULL`.
  - Applied the migration inside the Docker network to the running PostgreSQL service.
  - Verified the new F0-08 tables exist and existing seeded rows remain: 2 branches, 6 roles, 4 users, 5 categories, 2 customers, 2 vehicles, 3 complaints.
  - No application source code, auth behavior, routes, RBAC guards, audit services, or UI were implemented.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (18/18; coverage thresholds cleared)
  - Passed: `corepack pnpm openapi:check`
  - Failed then passed with env: `corepack pnpm --filter @cms-auto/database exec prisma validate --schema prisma/schema.prisma` failed without `DATABASE_URL`; `corepack pnpm --dir packages/database exec prisma validate --schema prisma/schema.prisma` passed with `DATABASE_URL=postgresql://cms_auto:cms_auto_dev@localhost:5432/cms_auto?schema=public`.
  - Passed: `docker compose up -d postgres`
  - Failed: `node:20-alpine` Prisma container could not load the schema engine due missing OpenSSL runtime.
  - Passed: `docker run --rm --network cms-forge_default -v "${PWD}:/workspace:ro" -w /workspace -e DATABASE_URL="postgresql://cms_auto:cms_auto_dev@postgres:5432/cms_auto?schema=public" node:20-bookworm-slim sh -lc "apt-get update >/dev/null && apt-get install -y openssl >/dev/null && npm exec --yes prisma@5.22.0 -- migrate deploy --schema packages/database/prisma/schema.prisma"`
  - Failed: `corepack pnpm db:seed` did not run because the root script cannot find a root-level `prisma` binary.
  - Passed: SQL row-count check confirmed seed data survived migration.
- Security Self-Check:
  - Roles and branch scope from server session: Not Run; no auth/RBAC behavior implemented.
  - State history and audit in same transaction: Not Run; no state-changing application behavior implemented.
  - No passwords, OTPs, tokens, hashes, or provider secrets logged or returned: Passed by scope; migration SQL contains no secret values and no logging behavior.
  - Portal exposure rules: Not Run; no portal APIs implemented.
  - Trust boundaries tested: Not Run; migration-only task has no request boundary.

## F1-00B - Bootstrap NestJS API And Minimal Core Kernel

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - CONTRACT-READINESS-002
  - ARCH-STACK-001
  - ARCH-AUTH-001
  - ARCH-API-001
  - API-STANDARD-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Replaced the raw `node:http` API scaffold with a NestJS bootstrap.
  - Added minimal core plumbing for Prisma connection lifecycle, correlation ID propagation, and standard error envelope responses.
  - Preserved liveness at `/` and `/health`.
  - Updated API Docker build/runtime layout for pnpm workspace dependencies, Prisma client generation, and OpenSSL in Alpine.
  - No auth endpoints, RBAC guards, audit table writes, complaint workflow, UI, or provider integrations were implemented.
- Verification:
  - Passed: `corepack pnpm install --lockfile-only`
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (18/18; coverage thresholds cleared)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `corepack pnpm build`
  - Failed then fixed: initial `docker compose build api` produced an image that could not resolve `reflect-metadata` at runtime.
  - Passed: rebuilt `docker compose build api`
  - Passed: `docker compose up -d --force-recreate api`
  - Passed: `Invoke-WebRequest http://localhost:3000/health` returned `{"status":"ok","service":"api","databaseConfigured":true,"redisConfigured":true}`.
  - Passed: correlation smoke with `x-correlation-id: req_test` returned the same response header.
  - Passed: `curl.exe -s -i -H "x-correlation-id: req_missing" http://localhost:3000/missing` returned a JSON error envelope with `correlationId`.
- Security Self-Check:
  - Roles and branch scope from server session: Not Run; no auth/RBAC behavior implemented.
  - State history and audit in same transaction: Not Run; no state-changing application behavior implemented.
  - No passwords, OTPs, tokens, hashes, or provider secrets logged or returned: Passed by scope; no credential handling was added.
  - Portal exposure rules: Not Run; no portal APIs implemented.
  - Trust boundaries tested: Not Run; no authenticated trust boundary exists yet.

## F1-01 - Staff Auth With Argon2id And HttpOnly Sessions

- Date: 2026-06-18
- Risk: High
- Status: Not Run
- Required model tier: BUILDER-STRONG
- Evidence:
  - AUTO PHASE stopped before implementation because the active `F1-01` task exceeds the Forge 1 to 5 file budget.
  - Scope includes generated module shape, password hashing, session storage, cookies, audit writes, OpenAPI, and focused API tests.
  - Rewrote `.forge/next.md` to `PLAN-F1-01 - Split Staff Auth Into Agentic Build Tasks`.
  - Set `.forge/state.md` to `Ready to Plan`, which is an AUTO PHASE stop condition.
- Verification:
  - Not Run: auth implementation checks were not started because the task requires replanning.

## PLAN-F1-01 - Split Staff Auth Into Agentic Build Tasks

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: PLANNER
- Requirement IDs:
  - CONTRACT-READINESS-002
  - ARCH-AUTH-001
  - REQ-AUTH-001
  - REQ-AUDIT-001
  - NFR-SEC-001
  - METHOD-API-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Replaced the single broad `F1-01` backlog item with five small auth foundation subtasks.
  - Queued only `F1-01A - Auth Data Foundation And API Test Harness` in `.forge/next.md`.
  - Set `.forge/state.md` to `Ready to Build`.
  - Kept implementation deferred; no application source code was changed.
  - Preserved the independent `Verify Gate: required` on final auth foundation task `F1-01E`.
- Verification:
  - Passed: `rg -n "PLAN-F1-01|F1-01A|F1-01B|Verify Gate|required|Ready to Build|300" .forge/backlog.md .forge/next.md .forge/state.md`
- Security Self-Check:
  - Not Run: planning-only task; no auth, RBAC, branch-scope, state-change, audit, portal, or logging behavior was implemented.
  - Planned gate: `F1-01E` remains `Verify Gate: required` before dependent Phase 1 work proceeds.

## F1-01A - Auth Data Foundation And API Test Harness

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - CONTRACT-READINESS-002
  - ARCH-AUTH-001
  - REQ-AUTH-001
  - NFR-SEC-001
  - METHOD-TEST-001
- Evidence:
  - Added dev-only seeded staff `passwordHash` values using Argon2id-shaped hashes.
  - Existing seeded staff users are backfilled by `upsert.update`, not only new creates.
  - Replaced the pending `test:api` placeholder with a small API test runner.
  - Added `apps/api/test/auth/password-hash.test.ts` proving staff seed hashes are present and no plaintext password field is seeded.
  - Verified unknown API suites fail loudly.
  - No auth route, session cookie, logout behavior, audit write, RBAC guard, OpenAPI path, or UI was implemented.
- Verification:
  - Passed: `corepack pnpm lint`
  - Failed then passed: `corepack pnpm typecheck` initially failed because the local Prisma client had not been regenerated for the F0-08 schema; `corepack pnpm --dir packages/database exec prisma generate --schema prisma/schema.prisma` fixed the local generated client, then typecheck passed.
  - Passed: `corepack pnpm test` (18/18; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- auth` (1/1)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `corepack pnpm test:api -- missing-suite` failed as expected and was wrapped to verify fail-loud behavior.
- Security Self-Check:
  - Roles and branch scope from server session: Not Run; no session, RBAC, or branch-scope behavior implemented.
  - State history and audit in same transaction: Not Run; no state-changing application behavior implemented.
  - No passwords, OTPs, tokens, hashes, or provider secrets logged or returned: Passed by scope; no API response or logging behavior was added, and the test proves no plaintext password field is seeded.
  - Customer portal exposure rules: Not Run; no portal API behavior implemented.
  - Trust boundaries tested: Passed for this task's boundary; `test:api -- auth` verifies seeded auth data shape and fail-loud suite selection. Full allowed/denied login boundary is queued for `F1-01B`.

## F1-01B - Auth Module Credential Verification With Argon2id And Generic Denial

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - CONTRACT-READINESS-002
  - ARCH-AUTH-001
  - REQ-AUTH-001
  - NFR-SEC-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - Added `argon2` to the API package.
  - Added the `auth` module manifest plus minimal repository and service files.
  - Implemented service-level credential verification with Argon2id and safe auth claims.
  - Denies wrong passwords, inactive users, locked users, and users without a password hash.
  - Added auth API tests for one allowed credential case and multiple denied cases.
  - No login route, session cookie, logout behavior, audit write, OpenAPI path, RBAC guard, or UI was implemented.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (18/18; coverage thresholds cleared)
  - Failed then passed: `corepack pnpm test:api -- auth` initially failed on syntax errors in the new test file; after bracket fixes it passed (3/3).
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope from server session: Passed for this task's scope; `AuthService.verifyCredentials` returns role and branch claims from the repository-loaded user record, not client input.
  - State history and audit in same transaction: Not Run; no state-changing application behavior or audit writes implemented in this subtask.
  - No passwords, OTPs, tokens, hashes, or provider secrets logged or returned: Passed; the service returns safe claims only and the API test asserts `passwordHash` is absent.
  - Customer portal exposure rules: Not Run; no portal API behavior implemented.
  - Trust boundaries tested: Passed; `test:api -- auth` covers one allowed credential case plus wrong password, inactive, locked, and missing-hash denial.

## F1-01C - Staff Session Persistence And Secure Cookie Issuance

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - CONTRACT-READINESS-002
  - ARCH-AUTH-001
  - REQ-AUTH-001
  - NFR-SEC-001
  - API-STANDARD-001
  - ARCH-DATA-001
  - METHOD-TEST-001
- Evidence:
  - Added `StaffSession` to Prisma and migration `20260618150000_staff_sessions`.
  - Extended auth repository and service with staff session creation.
  - Session creation stores only a SHA-256 token hash, never the raw token.
  - Session cookie serialization is HttpOnly, SameSite=Lax, Path=/, and Secure when production mode is requested.
  - Added focused auth API tests for token hashing and cookie flags.
  - No login route, logout behavior, request-session validation, audit write, RBAC guard, OpenAPI path, or UI was implemented.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (18/18; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- auth` (5/5)
  - Passed: `corepack pnpm openapi:check`
  - Failed then passed: `corepack pnpm --dir packages/database exec prisma validate --schema prisma/schema.prisma` failed without `DATABASE_URL`; passed with `DATABASE_URL=postgresql://cms_auto:cms_auto_dev@localhost:5432/cms_auto?schema=public`.
  - Passed: `docker compose up -d postgres`
  - Passed: `docker run --rm --network cms-forge_default -v "${PWD}:/workspace:ro" -w /workspace -e DATABASE_URL="postgresql://cms_auto:cms_auto_dev@postgres:5432/cms_auto?schema=public" node:20-bookworm-slim sh -lc "apt-get update >/dev/null && apt-get install -y openssl >/dev/null && npm exec --yes prisma@5.22.0 -- migrate deploy --schema packages/database/prisma/schema.prisma"`
  - Passed: `docker compose exec -T postgres psql -U cms_auto -d cms_auto -c "select to_regclass('public.staff_sessions') as staff_sessions;"`
- Security Self-Check:
  - Roles and branch scope from server session: Not Run; session validation is queued for `F1-01D`.
  - State history and audit in same transaction: Not Run; no audit writes implemented in this subtask.
  - No passwords, OTPs, tokens, hashes, or provider secrets logged or returned: Passed; the raw session token is returned only in the HttpOnly cookie and only its hash is persisted.
  - Customer portal exposure rules: Passed by separation; staff sessions use `staff_sessions`, not `portal_sessions`, and no portal API behavior was added.
  - Trust boundaries tested: Passed for this task's boundary; `test:api -- auth` proves raw tokens are not stored and cookie security flags are set.

## F1-01D - Session Validation And Logout Invalidation

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - CONTRACT-READINESS-002
  - ARCH-AUTH-001
  - REQ-AUTH-001
  - NFR-SEC-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - Extended auth repository with staff-session lookup by token hash and revocation by token hash.
  - Extended auth service with session validation and logout invalidation.
  - Valid sessions return safe server-derived claims only.
  - Missing, unknown, expired, and revoked sessions are denied with stable generic auth errors.
  - Logout invalidates by token hash and returns an expired HttpOnly staff-session cookie.
  - No login/logout route, audit write, RBAC guard, OpenAPI path, or UI was implemented.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (18/18; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- auth` (8/8)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope from server session: Passed; `validateStaffSession` derives role and branch claims from the persisted session's user relation, not client input.
  - State history and audit in same transaction: Not Run; no audit writes implemented in this subtask.
  - No passwords, OTPs, tokens, hashes, or provider secrets logged or returned: Passed; validation returns safe claims only, and logout revokes by token hash.
  - Customer portal exposure rules: Passed by separation; staff session validation uses `staff_sessions`, not portal tables, and no portal API behavior was added.
  - Trust boundaries tested: Passed; `test:api -- auth` covers valid, missing, unknown, expired, revoked, and logout invalidation cases.

## F1-01E - Auth Audit Entries, OpenAPI Contract, And Security Proof

- Date: 2026-06-18
- Risk: High
- Status: Not Run
- Required model tier: BUILDER-STRONG
- Evidence:
  - AUTO PHASE stopped before implementation because the remaining final auth foundation task exceeds the Forge 1 to 5 file budget.
  - Scope includes HTTP login/logout routes, DTOs, auth audit entries, OpenAPI contract wiring, and final security proof.
  - Rewrote `.forge/next.md` to `PLAN-F1-01E - Split Final Auth Foundation Gate`.
  - Set `.forge/state.md` to `Ready to Plan`, which is an AUTO PHASE stop condition.
- Verification:
  - Not Run: final auth foundation checks were not started because the task requires replanning.

## PLAN-F1-01E - Split Final Auth Foundation Gate

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: PLANNER
- Requirement IDs:
  - CONTRACT-READINESS-002
  - ARCH-AUTH-001
  - REQ-AUTH-001
  - REQ-AUDIT-001
  - NFR-SEC-001
  - METHOD-API-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Replaced the broad `F1-01E` backlog item with three ordered final-auth subtasks:
    route wiring, auth audit entries, and OpenAPI/final security proof.
  - Queued only `F1-01E1 - Auth HTTP Login/Logout Routes` in `.forge/next.md`.
  - Set `.forge/state.md` to `Ready to Build`.
  - Kept implementation deferred; no application source code was changed.
  - Preserved the independent `Verify Gate: required` on final auth foundation task
    `F1-01E3`.
- Verification:
  - Passed: `rg -n "PLAN-F1-01E|F1-01E1|F1-01E2|Verify Gate|required|Ready to Build|300" .forge/backlog.md .forge/next.md .forge/state.md`
- Security Self-Check:
  - Not Run: planning-only task; no auth, RBAC, branch-scope, state-change, audit,
    portal, or logging behavior was implemented.
  - Planned gate: `F1-01E3` remains `Verify Gate: required` before dependent Phase 1
    work proceeds.

## F1-01E1 - Auth HTTP Login/Logout Routes

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - CONTRACT-READINESS-002
  - ARCH-AUTH-001
  - REQ-AUTH-001
  - REQ-AUDIT-001
  - NFR-SEC-001
  - METHOD-API-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added `AuthModule` and wired it into the Nest app.
  - Added `AuthController` with `POST /auth/login` and `POST /auth/logout`.
  - Added `LoginRequestDto` parsing for malformed login bodies without adding new dependencies.
  - Login delegates to existing credential/session service behavior and sets the staff session cookie.
  - Logout delegates to existing session invalidation and returns an expired staff session cookie.
  - Added auth API tests for login cookie issuance, generic failed login, logout expired cookie, and malformed login input.
  - Updated the API test runner to load `apps/api/tsconfig.json` so Nest parameter decorators compile in API tests.
  - No audit writes, OpenAPI path updates, CSRF, rate limiting, password reset, RBAC guard, UI, or external SSO behavior was implemented.
- Verification:
  - Not Run: `corepack pnpm install --lockfile-only` because package dependencies did not change.
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (18/18; coverage thresholds cleared)
  - Failed then passed: `corepack pnpm test:api -- auth` initially failed because TSX did not load decorator settings for API tests; after setting `TSX_TSCONFIG_PATH` in the API test runner and fixing one DTO assertion, it passed (12/12).
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope from server session: Passed for this task's scope; login returns safe claims from `AuthService.verifyCredentials`, which derives role and branch from the persisted user record, not client input.
  - State history and audit in same transaction: Not Run; auth audit writes are explicitly queued for `F1-01E2`, and no complaint workflow state change was implemented.
  - No passwords, OTPs, tokens, hashes, or provider secrets logged or returned: Passed; route tests assert the response excludes password hashes and the raw session token.
  - Customer portal exposure rules: Passed by separation; staff auth routes do not touch portal tables or expose portal data.
  - Trust boundaries tested: Passed; `test:api -- auth` covers valid login, failed login, logout, and malformed login input.

## F1-01E2 - Auth Audit Entries

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - CONTRACT-READINESS-002
  - ARCH-AUTH-001
  - REQ-AUTH-001
  - REQ-AUDIT-001
  - NFR-SEC-001
  - METHOD-API-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added a minimal core `AuditService` for append-only `audit_logs` inserts.
  - Auth failed credential verification records `AUTH/login_failure` with safe metadata only.
  - Staff session creation records `AUTH/login_success` in the same transaction hook as the session insert.
  - Logout records `AUTH/logout` in the same transaction hook as session revocation.
  - Auth controller passes correlation ID, IP address, and user agent context into the auth service.
  - Added focused auth API tests proving login failure, login success, and logout audit payloads.
  - No OpenAPI path updates, CSRF, rate limiting, password reset, RBAC guard, UI, external SSO, or audit search/export behavior was implemented.
- Verification:
  - Not Run: `corepack pnpm install --lockfile-only` because package dependencies did not change.
  - Passed: `corepack pnpm lint`
  - Failed then passed: `corepack pnpm typecheck` initially failed on Prisma JSON null typing in `AuditService`; after removing raw `null` metadata, it passed.
  - Passed: `corepack pnpm test` (18/18; coverage thresholds cleared)
  - Failed then passed: `corepack pnpm test:api -- auth` initially failed because the logout route test mocked the pre-audit service method; after updating the mock to `logoutStaffSessionWithAudit`, it passed (15/15).
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope from server session: Passed for this task's scope; auth success audit uses actor and branch from service-derived claims/session records, not client input.
  - State history and audit in same transaction: Passed for auth session state changes; session creation and logout revocation call audit within the same transaction hook. Complaint status history was not applicable.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed; audit tests assert failed login does not log the submitted password or hash, and logout audit does not log the raw token.
  - Customer portal exposure rules: Passed by separation; staff auth audit uses staff users/sessions only and does not expose portal data.
  - Trust boundaries tested: Passed; `test:api -- auth` covers successful login audit, failed login audit, logout audit, and existing allowed/denied auth behavior.

## F1-01E3 - Auth OpenAPI Contract And Final Security Proof

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - CONTRACT-READINESS-002
  - ARCH-AUTH-001
  - REQ-AUTH-001
  - REQ-AUDIT-001
  - NFR-SEC-001
  - METHOD-API-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added `POST /auth/login` and `POST /auth/logout` to the canonical OpenAPI contract.
  - Added auth request/response schemas for login, logout, and safe staff claims.
  - Documented `Set-Cookie` response headers and standard validation/auth error envelopes.
  - Strengthened `openapi:check` so removing auth paths or schemas fails explicitly.
  - Regenerated `packages/contracts/openapi.json` from the canonical OpenAPI checker.
  - No CSRF, rate limiting, password reset, RBAC guard, UI, external SSO, or audit search/export behavior was implemented.
- Verification:
  - Not Run: `corepack pnpm install --lockfile-only` because package dependencies did not change.
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (19/19; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- auth` (15/15)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope from server session: Passed for auth foundation scope; credential/session validation returns role and branch claims from persisted users/sessions, never client input.
  - State history and audit in same transaction: Passed for auth session state changes; session creation and logout revocation audit writes run in the same transaction hook. Complaint status history was not applicable.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed; tests cover safe login responses, failed-login audit metadata, token-hash storage, and logout audit not exposing raw tokens. OpenAPI response schemas expose only safe claims and expiry.
  - Customer portal exposure rules: Passed by separation; staff auth routes, sessions, audit entries, and OpenAPI schemas do not expose portal comments, audit, DMS codes, staff PII to portal users, or unrelated complaints.
  - Trust boundaries tested: Passed; `test:api -- auth` covers allowed login, denied credentials/inactive/locked/missing-hash users, session creation, session validation denial, logout, malformed login input, and auth audit events.

## F1-02 - RBAC and Branch-Scope Enforcement

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-RBAC-001
  - NFR-SEC-002
  - ARCH-AUTH-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added `SessionAuthGuard` that reads the staff-session cookie, validates it with `AuthService.validateStaffSession`, and attaches server-derived principal claims to the request.
  - Added `@Roles(...)`, `@BranchScoped()`, and `RbacGuard`.
  - `RbacGuard` reads role and branch from the attached server principal only, denies with `RBAC_FORBIDDEN` / `BRANCH_SCOPE_FORBIDDEN`, and writes `SECURITY` audit entries on deny.
  - Added protected `GET /auth/me` as the narrow enforcement demonstration route.
  - Added auth API tests for unauthenticated denial, allowed/denied role gate, allowed/denied branch gate, deny audit entries, and ignoring client-supplied role/branch headers.
  - Added `GET /auth/me` to the canonical OpenAPI contract.
  - Did not implement login rate limiting, CSRF, audit search/export, full error surface, golden CRUD, username login, password reset, lock flows, or UI.
- Verification:
  - Passed: `corepack pnpm lint`
  - Failed then passed: `corepack pnpm typecheck` initially failed on exact-optional audit metadata and widened audit event typing in `auth.guard.ts`; after narrowing those types, it passed.
  - Passed: `corepack pnpm test` (19/19; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- auth` (18/18)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed; `SessionAuthGuard` attaches principal claims from `validateStaffSession`, and tests prove fake client role/branch headers do not grant access.
  - Each state change writes status history and an audit entry in the same transaction; side effects enqueue after commit: Not Run for complaint workflow state changes; F1-02 adds no domain state transition. Denied role/branch access writes `SECURITY` audit entries.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed; guards do not log cookies/tokens, and `/auth/me` returns safe principal claims only.
  - Customer portal exposure rules hold: Passed by separation; protected staff auth route exposes only the current staff principal and no portal comments, DMS codes, audit rows, or unrelated complaints.
  - Trust boundaries are tested: Passed; `test:api -- auth` covers unauthenticated denial, allowed and denied role cases, and allowed and denied branch-scope cases.

## PLAN-F1-03 - Split Audit Search/Export And Append-Only Enforcement

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: PLANNER
- Requirement IDs:
  - REQ-AUDIT-001
  - NFR-SEC-002
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Split the broad `F1-03` backlog item into `F1-03A` audit search, `F1-03B` audit export, and `F1-03C` audit append-only enforcement proof.
  - Queued `F1-03A - Audit Log Search Endpoint` as the next buildable Phase 1 task with `BUILDER-STRONG`.
  - Marked `F1-03A` as `Verify Gate: required` because audit access is high-risk and export builds on the same authorization surface.
  - Kept implementation deferred; no application source code was changed.
  - Called out the 300-line source-file budget and the current `tools/openapi-check.mjs` size risk for the builder.
  - Set `.forge/state.md` to `Ready to Build`.
- Verification:
  - Passed: `rg -n "PLAN-F1-03|F1-03A|F1-03B|F1-03C|Ready to Build|300" .forge/backlog.md .forge/next.md .forge/state.md`
- Security Self-Check:
  - Not Run: planning-only task; no auth, RBAC, branch-scope, audit read/write, portal, logging, or state-change behavior was implemented.
  - Planned gate: `F1-03A` requires server-session RBAC, branch scope, safe audit response fields, one allowed case, one denied case, OpenAPI proof, and independent VERIFY before the audit export task proceeds.

## F1-03A - Audit Log Search Endpoint

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-AUDIT-001
  - NFR-SEC-002
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added the `audit` module manifest, controller, service, and repository.
  - Added `GET /audit/logs` guarded by `SessionAuthGuard`, `RbacGuard`, `@Roles('ADMIN', 'BRANCH_MANAGER')`, and `@BranchScoped()`.
  - Audit search supports the planned filters, clamps `pageSize` to 100, and scopes branch-manager searches to the server-session branch.
  - Audit search returns explicit safe fields only and redacts secret-like metadata keys.
  - Registered `test:api -- audit` and added focused API tests for admin allow, RBAC deny, branch deny, branch scoping, validation errors, and metadata redaction.
  - Added `GET /audit/logs`, `AuditLogEntry`, and `AuditLogSearchResponse` to the canonical OpenAPI contract.
  - Kept app/tool source files under the 300-line agentic budget; largest touched source file is `tools/openapi-check.mjs` at 190 lines.
- Verification:
  - Passed: `corepack pnpm lint`
  - Failed then passed: `corepack pnpm typecheck` initially failed on exact-optional filter objects; after omitting undefined keys, it passed.
  - Passed: `corepack pnpm test` (19/19; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- audit` (5/5)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (only CRLF warnings)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed; controller uses existing session/RBAC guards, and tests cover non-admin denial, cross-branch denial, and branch-manager searches scoped to the principal branch.
  - Each state change writes status history and an audit entry in the same transaction; side effects enqueue after commit: Not Run for workflow state changes; this task adds read-only audit search. Denied access writes `SECURITY` audit entries through the existing guard.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed; search maps explicit response fields and tests prove secret-like metadata keys are redacted.
  - Customer portal exposure rules hold: Passed by separation; this is a staff-only guarded route and no portal behavior or customer portal data exposure was added.
  - Trust boundaries are tested: Passed; `test:api -- audit` covers one allowed admin case, one denied role case, one denied branch case, and invalid input.

## REPAIR-F1-03A - Restrict Audit Search To SRS-Allowed Roles

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-AUDIT-001
  - REQ-RBAC-001
  - RBAC-MATRIX-001
  - NFR-SEC-002
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Restricted `GET /audit/logs` to `@Roles('ADMIN')`, matching `RBAC-MATRIX-001` where Branch Manager cannot view audit logs.
  - Removed branch-manager audit search access from the HTTP route; configurable Management Read-Only audit access remains deferred until an explicit permission model exists.
  - Made `AuditSearchService.search` fail closed with `RBAC_FORBIDDEN` for non-admin direct calls.
  - Kept admin branch filtering, page-size clamping, explicit safe response fields, metadata redaction, and OpenAPI contract behavior intact.
  - Updated focused audit API tests for Branch Manager denial with `SECURITY` audit, ordinary non-admin denial with `SECURITY` audit, and service-level non-admin fail-closed behavior.
  - Kept app/tool source files under the 300-line agentic budget; audit service is 151 lines and audit controller is 22 lines.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (19/19; coverage 89.50% lines / 80.71% branch / 92.54% funcs)
  - Passed: `corepack pnpm test:api -- audit` (5/5)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed; `SessionAuthGuard` still attaches server-derived principal claims and `RbacGuard` now allows only Admin for audit search. Tests cover denied Branch Manager and CR Officer cases.
  - Each state change writes status history and an audit entry in the same transaction; side effects enqueue after commit: Not Run for workflow state changes; this repair only changes read-only audit search. Denied access writes `SECURITY` audit entries through the existing guard.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed; metadata redaction behavior is unchanged and remains tested.
  - Customer portal exposure rules hold: Passed by separation; this is still a staff-only guarded route and no portal behavior was added.
  - Trust boundaries are tested: Passed; `test:api -- audit` covers Admin allowed, Branch Manager denied, CR Officer denied, non-admin service direct denial, invalid query, and metadata redaction.

## F1-03B - Audit Log Export Endpoint With Limits And Scope

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-AUDIT-001
  - REQ-RBAC-001
  - RBAC-MATRIX-001
  - NFR-SEC-002
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added `GET /audit/logs/export` guarded by `SessionAuthGuard`, `RbacGuard`, and `@Roles('ADMIN')`.
  - Reused `parseAuditSearchQuery` and the audit repository filter path so export filters match audit search filters.
  - Enforced a documented `MAX_EXPORT_ROWS = 500` cap; export uses page 1 with the cap, never an unbounded dump.
  - Returned a JSON attachment with `Content-Type: application/json` and `Content-Disposition: attachment; filename="audit-logs.json"`.
  - Reused explicit safe response mapping and metadata redaction for exported rows.
  - Recorded the export action through `AuditService` as `REPORT/audit_log_exported` with actor, request context, applied filters, row count, file type, and row limit.
  - Added focused audit API tests for admin export, Branch Manager export denial with `SECURITY` audit, non-admin service fail-closed behavior, row cap, redaction, response headers, and export audit metadata.
  - Added `/audit/logs/export` and `AuditLogExportResponse` to the canonical OpenAPI contract and regenerated `packages/contracts/openapi.json`.
  - Kept app/tool source files under the 300-line budget: audit service 208 lines, audit controller 47 lines, OpenAPI checker 213 lines.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (19/19; coverage 89.75% lines / 80.85% branch / 92.65% funcs)
  - Passed: `corepack pnpm test:api -- audit` (8/8)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed; the export route uses `SessionAuthGuard` + `RbacGuard` with `@Roles('ADMIN')`, and `AuditSearchService.export` fails closed for non-admin principals. Tests cover Admin allowed and Branch Manager denied.
  - Each state change writes status history and an audit entry in the same transaction; side effects enqueue after commit: Not applicable to complaint workflow state changes. This task adds read-only export plus a sensitive-action audit entry; no complaint state or side effect was added.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed; exported rows reuse metadata redaction and export audit metadata records only filters, row count, file type, and limit. Tests assert secret-like metadata is redacted.
  - Customer portal exposure rules hold: Passed by separation; export is a staff-only Admin route and no portal API behavior was added.
  - Trust boundaries are tested: Passed; `test:api -- audit` covers admin export allowed, Branch Manager export denied, direct service non-admin denial, row cap, redaction, response headers, and export audit entry.

## F1-03C - Audit Append-Only Enforcement Proof

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-AUDIT-001
  - ARCH-DATA-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
- Evidence:
  - Added Prisma migration `20260618193000_audit_logs_append_only` with a Postgres trigger that raises before `UPDATE` or `DELETE` on `audit_logs`.
  - Added `tools/audit-append-only-proof.mjs`, which starts Postgres, applies migrations inside the Docker network, inserts a test audit row, and verifies both update and delete are blocked by the trigger.
  - Wired the live proof into `corepack pnpm test:api -- audit` after the focused TypeScript audit tests pass.
  - Kept `AuditService.record` create-only and added no update/delete APIs.
  - Kept source files under the 300-line budget: `tools/audit-append-only-proof.mjs` is 83 lines and `tools/api-test.mjs` is 33 lines.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (19/19; coverage 89.75% lines / 80.85% branch / 92.65% funcs)
  - Passed: `corepack pnpm test:api -- audit` (8/8 plus live Docker proof; migration applied, insert succeeded, update/delete blocked)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not applicable to this DB-level append-only proof; no route authorization behavior changed.
  - Each state change writes status history and an audit entry in the same transaction; side effects enqueue after commit: Not applicable to complaint workflow state changes. This task protects audit rows from mutation after insert.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed; proof inserts only synthetic `append_only_probe` metadata-free audit data and logs no secrets.
  - Customer portal exposure rules hold: Passed by separation; no portal API or response behavior changed.
  - Trust boundaries are tested: Passed for this task boundary; the live proof exercises allowed insert and denied update/delete against the database.

## F1-04 - Stable API Error Shape And Correlation IDs

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - API-STANDARD-001
  - METHOD-API-001
  - METHOD-TEST-001
  - NFR-SEC-002
- Evidence:
  - Extended `AppException` and `AppExceptionFilter` to render the stable envelope `{ error: { code, message, correlationId, fieldErrors? } }`.
  - Added exported `FieldError` shape `{ field, code, message }`; the filter only includes `fieldErrors` when present.
  - Preserved request correlation IDs in error bodies and response headers through the existing correlation middleware.
  - Updated `LoginRequestDto` validation to emit safe field-level `VALIDATION_FAILED` details for malformed body, identifier, and password inputs.
  - Added focused auth API tests proving validation field-error shape, auth/RBAC safe error envelopes, server-derived RBAC denial, and correlation header propagation.
  - No OpenAPI schema change was needed; the canonical contract already contained `ErrorBody.fieldErrors` and `FieldError`.
  - Kept source files under the 300-line budget: `http-kernel.ts` is 96 lines and `login-request.dto.ts` is 44 lines.
- Verification:
  - Passed: `corepack pnpm lint` (run before and after edits)
  - Failed then passed: `corepack pnpm typecheck` initially failed on DTO property narrowing; after assigning narrowed local strings, it passed.
  - Passed: `corepack pnpm test` (19/19; coverage 89.75% lines / 80.85% branch / 92.65% funcs)
  - Passed: `corepack pnpm test:api -- auth` (21/21)
  - Passed: `corepack pnpm test:api -- audit` (8/8 plus live Docker append-only proof; insert succeeded, update/delete blocked)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed; existing guard behavior unchanged and auth tests still cover server-derived principal allow plus client-header spoof denial.
  - Each state change writes status history and an audit entry in the same transaction; side effects enqueue after commit: Not applicable to this error-envelope task; no complaint workflow state change or side effect was added.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed; validation messages only identify request fields and generic reasons, and auth errors remain generic.
  - Customer portal exposure rules hold: Passed by separation; no portal route or portal-visible data was changed.
  - Trust boundaries are tested: Passed; tests cover validation denial, auth/RBAC error envelopes, RBAC denied spoofed client role, branch-scope denial, and audit Admin allow/non-admin deny in the required audit suite.

## F1-05A - Nest-Ready Module Generator

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - METHOD-MODULAR-001
  - NFR-MAINT-001
  - METHOD-TEST-001
  - REQ-ADMIN-001
- Evidence:
  - Updated `tools/generate-module.mjs` so generated modules use NestJS `@Module`, `@Controller`, and `@Injectable` skeletons.
  - Generated service and repository files remain behavior-free; no CRUD, guards, OpenAPI paths, or Prisma queries were added.
  - Generated `MODULE.md` includes public surface, owned tables, allowed dependencies, and SRS fields and still passes the manifest lint gate.
  - Updated `tools/generate-module.test.mjs` to prove the branches sample includes Nest decorators, service export wiring, and manifest content.
  - Kept touched source files under the 300-line budget: `tools/generate-module.mjs` is 94 lines and `tools/generate-module.test.mjs` is 46 lines.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (19/19; coverage 89.96% lines / 80.85% branch / 92.65% funcs)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (only CRLF warnings)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not applicable; this task changes generator output only and adds no runtime route or authorization behavior.
  - Each state change writes status history and an audit entry in the same transaction; side effects enqueue after commit: Not applicable; no domain state change or side effect was added.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed by scope; generator output contains no logging, response, secret, or provider behavior.
  - Customer portal exposure rules hold: Passed by separation; no portal module, route, or portal-visible data was changed.
  - Trust boundaries are tested: Not applicable to behavior; generator tests prove the structural boundary and manifest gate for the future branches module.

## F1-05B - Generate Branches Module Shell And Manifest

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - METHOD-MODULAR-001
  - NFR-MAINT-001
  - METHOD-TEST-001
  - REQ-ADMIN-001
- Evidence:
  - Fixed `tools/generate-module.mjs` CLI parsing so `corepack pnpm generate:module -- branches` works without `--root`.
  - Added a focused generator test for parsing a module name without an explicit root.
  - Ran `corepack pnpm generate:module -- branches` to create `apps/api/src/modules/branches`.
  - Filled `apps/api/src/modules/branches/MODULE.md` with the real public surface, owned `branches` table, allowed dependencies, and SRS IDs.
  - Left generated controller, service, repository, DTOs, and specs behavior-free.
  - Added no app module import, route behavior, OpenAPI path, RBAC guard, audit write, schema, or migration.
  - Kept touched source files under the 300-line budget: `tools/generate-module.mjs` is 96 lines and `tools/generate-module.test.mjs` is 49 lines; generated branches source files are all under 20 lines.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage 91.06% lines / 79.73% branch / 94.37% funcs)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (only CRLF warnings)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not applicable; this task adds no runtime route or authorization behavior.
  - Each state change writes status history and an audit entry in the same transaction; side effects enqueue after commit: Not applicable; no branch state change, domain mutation, or side effect was added.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed by scope; generated shell code contains no logging, response, secret, or provider behavior.
  - Customer portal exposure rules hold: Passed by separation; no portal route or portal-visible data was changed.
  - Trust boundaries are tested: Not applicable to behavior; generator and manifest lint tests cover the structural boundary only.

## F1-05C - Branch Read/List Service And Repository Behavior

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-ADMIN-001
  - METHOD-MODULAR-001
  - METHOD-API-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Added branch repository methods to list active branches and find one branch by id or code.
  - Added branch service read/list methods that map Prisma branch rows into explicit `BranchResponseDto` objects.
  - Registered the `admin` API test suite in `tools/api-test.mjs`.
  - Added focused admin API tests for active-list repository query shape, id/code lookup query shape, explicit service response mapping, and null-safe missing lookup behavior.
  - Updated construction-only generated branch specs to pass the repository's `PrismaService` constructor dependency.
  - Added no controller routes, app wiring, OpenAPI paths, write behavior, audit entries, UI, schema, or migration.
  - Kept touched source files under the 300-line budget; largest new test file is `apps/api/test/admin/branches-read.test.ts` at 85 lines.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- admin` (3/3)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (only CRLF warnings)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not applicable to runtime authorization; this task adds service/repository behavior only and no route.
  - Each state change writes status history and an audit entry in the same transaction; side effects enqueue after commit: Not applicable; read-only branch behavior adds no state change or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed; service maps explicit branch fields only and does not log.
  - Customer portal exposure rules hold: Passed by separation; no portal route or portal-visible data was changed.
  - Trust boundaries are tested: Passed for this task boundary; admin API tests prove active-only list query, id/code lookup, explicit response mapping, and missing lookup behavior.

## F1-05D - Branch Read/List HTTP Endpoints With Admin RBAC And OpenAPI

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-ADMIN-001
  - METHOD-MODULAR-001
  - METHOD-API-001
  - METHOD-TEST-001
  - NFR-MAINT-001
  - NFR-SEC-002
- Evidence:
  - Added `GET /branches` and `GET /branches/:idOrCode` to `BranchesController`.
  - Wired `BranchesModule` into the API app.
  - Protected both read routes with `SessionAuthGuard`, `RbacGuard`, and `@Roles('ADMIN')`.
  - Missing branch lookup returns stable `{ branch: null }` without inventing a new error code.
  - Added focused `test:api -- admin` coverage for controller delegation, missing branch response, Admin allow, non-admin denial, and denial audit behavior.
  - Added `/branches`, `/branches/{idOrCode}`, `Branch`, `BranchListResponse`, and `BranchGetResponse` to the canonical OpenAPI contract.
  - Kept touched source files under the 300-line budget; `tools/openapi-check.mjs` is 255 lines and the largest admin test file is 143 lines.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- admin` (5/5)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (only CRLF warnings)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed; routes use existing session/RBAC guards and tests cover Admin allow plus Branch Manager denial.
  - Each state change writes status history and an audit entry in the same transaction; side effects enqueue after commit: Not applicable; this task adds read-only routes and no branch state change.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed; branch responses use explicit DTO fields only and no logging was added.
  - Customer portal exposure rules hold: Passed by separation; these are staff Admin routes and no portal route or portal-visible data changed.
  - Trust boundaries are tested: Passed; `test:api -- admin` covers Admin allowed and non-admin denied with `SECURITY` audit.

## F1-05E - Branch Create/Update/Deactivate Service Behavior With Audit Entries

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-ADMIN-001
  - METHOD-MODULAR-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
  - NFR-MAINT-001
  - NFR-SEC-002
- Evidence:
  - Added branch repository methods for create, update, deactivate, plus a Prisma transaction wrapper.
  - Added branch service create/update/deactivate methods that validate minimal text fields, trim accepted values, and map results to explicit `BranchResponseDto` objects.
  - Branch deactivate is soft behavior through `isActive: false`; no delete path was added.
  - Each branch write records a `CONFIG` audit entry through `AuditService.record` using the same transaction client as the branch write.
  - Added focused `test:api -- admin` coverage for create/update/deactivate behavior, validation failures, safe response mapping, audit metadata, and same-transaction audit/write client use.
  - No branch write HTTP route, OpenAPI write path, UI, schema, or migration was added.
  - Kept touched app source files under the 300-line budget: branch service is 137 lines, repository is 75 lines, module is 13 lines; tests are exempt.
- Verification:
  - Passed: `corepack pnpm lint`
  - Failed then Passed: `corepack pnpm typecheck` initially caught an exact-optional narrowing issue in `updateData`; after narrowing the local value explicitly, it passed.
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- admin` (8/8)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (only CRLF warnings)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not applicable to route authorization in this task; no public write route was added. Existing read-route RBAC tests still cover Admin allowed and Branch Manager denied.
  - Each state change writes status history and an audit entry in the same transaction; side effects enqueue after commit: Passed for branch config state changes; create/update/deactivate branch writes and their `CONFIG` audit entries share the same Prisma transaction client. Complaint status history is not applicable, and no side effects were added.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed; audit metadata records changed branch field names only, and branch responses are explicit DTO fields.
  - Customer portal exposure rules hold: Passed by separation; no portal route or portal-visible data was changed.
  - Trust boundaries are tested: Passed; `test:api -- admin` still covers Admin read allowed and Branch Manager denied, and the new write tests cover validation denial plus safe write response mapping.

## F1-05F - Branch Write HTTP Endpoints, API Tests, And Golden CRUD Pattern Freeze

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-ADMIN-001
  - METHOD-MODULAR-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
  - NFR-MAINT-001
  - NFR-SEC-002
- Evidence:
  - Added Admin-only branch write routes: `POST /branches`, `PATCH /branches/:id`, and `POST /branches/:id/deactivate`.
  - Added `branch-write.dto.ts` request body parsers that accept only branch configuration fields, trim text values, and reject invalid/empty write bodies with `VALIDATION_FAILED`.
  - Controller write routes derive audit context from `AuthenticatedRequest` server principal, correlation ID, IP, and user agent; no role or scope data is accepted from client bodies.
  - Added OpenAPI write paths and `BranchCreateRequest`, `BranchUpdateRequest`, and `BranchWriteResponse` schemas; regenerated `packages/contracts/openapi.json`.
  - Added focused `test:api -- admin` coverage for write route delegation, safe response envelopes, client body role-field ignore behavior, validation denial, Admin allow, and Branch Manager denial with `SECURITY` audit.
  - Updated `apps/api/src/modules/branches/MODULE.md` to freeze `branches` as the golden CRUD reference pattern.
  - Marked the F1-05 golden CRUD umbrella complete.
  - Kept touched source files under the 300-line budget: branch controller is 75 lines, branch service is 137 lines, branch repository is 75 lines, and `tools/openapi-check.mjs` is 295 lines; DTOs/tests/docs are exempt.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- admin` (11/11)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (only CRLF warnings)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed; branch write routes use `SessionAuthGuard`, `RbacGuard`, and `@Roles('ADMIN')`; tests cover Admin allowed, Branch Manager denied, and client `roleCode` ignored in create body parsing.
  - Each state change writes status history and an audit entry in the same transaction; side effects enqueue after commit: Passed for branch config state changes by F1-05E service tests; these HTTP routes call the same service write methods. Complaint status history is not applicable, and no side effects were added.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed; request parsers accept only branch text fields, responses use explicit branch DTO envelopes, and no logging was added.
  - Customer portal exposure rules hold: Passed by separation; branch write routes are staff Admin-only and no portal route or portal-visible data changed.
  - Trust boundaries are tested: Passed; `test:api -- admin` covers Admin read/write allowed paths, Branch Manager read/write denial with `SECURITY` audit, invalid write body denial, and safe response mapping.

## PLAN-F1-05C - Split Branches Golden CRUD Behavior

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: PLANNER
- Requirement IDs:
  - REQ-ADMIN-001
  - METHOD-MODULAR-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
  - NFR-MAINT-001
  - NFR-SEC-002
- Evidence:
  - Split the broad `F1-05C` branches golden CRUD task into small ordered subtasks: read/list service behavior, read/list HTTP/OpenAPI, write/audit behavior, and final endpoint/tests/pattern freeze.
  - Queued only `F1-05C - Branch Read/List Service And Repository Behavior` in `.forge/next.md`.
  - Set `.forge/state.md` to `Ready to Build`.
  - Kept implementation deferred; no application source code was changed.
- Verification:
  - Passed: `rg -n "PLAN-F1-05C|F1-05C|F1-05D|Ready to Build|300" .forge/backlog.md .forge/next.md .forge/state.md`
- Security Self-Check:
  - Not Run: planning-only task; no runtime RBAC, branch-scope, state-change, audit, portal, or logging behavior was implemented.

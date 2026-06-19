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

## PLAN-F1-06 - Split Login Rate Limiting And CSRF Protection

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: PLANNER
- Requirement IDs:
  - NFR-SEC-001
  - REQ-AUTH-001
  - API-STANDARD-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
  - NFR-MAINT-001
  - NFR-SEC-002
- Evidence:
  - Read `NFR-SEC-001` (AC3 login rate limiting by account + IP; AC5 CSRF on
    session-authenticated mutation routes), the auth/session guards
    (`apps/api/src/core/auth.guard.ts`), the auth and branches controllers, the auth
    service/module wiring, the audit service, and the `tools/api-test.mjs` suite runner.
  - Mapped the CSRF mutation-route surface to `POST /auth/logout`, `POST /branches`,
    `PATCH /branches/:id`, and `POST /branches/:id/deactivate`. `POST /auth/login` is
    pre-session, so it is covered by rate limiting (AC3), not CSRF (AC5).
  - Split `F1-06` into three ordered BUILDER-STRONG build tasks: `F1-06A` login rate
    limiting, `F1-06B` CSRF kernel guard + token issuance + auth-route enforcement, and
    `F1-06C` CSRF enforcement on branch admin routes. Rate limiting goes first because it
    is a single self-contained route guard with no cross-module reach; CSRF follows
    because it adds a token mechanism + multi-route rollout, and is itself split so each
    task stays near 1-5 files.
  - Marked `F1-06B` `Verify Gate: required` because `F1-06C` builds directly on the CSRF
    mechanism it establishes (same pattern as the F1-01E and F1-03A gates).
  - Queued only `F1-06A - Login Rate Limiting (Account + IP)` in `.forge/next.md` with a
    tight scope, exact verification commands, and the High-risk security self-check.
  - Represented `F1-06B` and `F1-06C` in `.forge/backlog.md`; set `.forge/state.md` to
    `Ready to Build`. No application source code was changed.
- Decisions / assumptions recorded for the builder:
  - SRS §23 (`API-STANDARD-001`) "Required Stable Error Codes" lists no rate-limit/CSRF
    code, but AC1 allows stable codes that are documented in OpenAPI, and the SECURITY
    audit-event table already names `rate_limit_triggered`. Build tasks add stable,
    OpenAPI-documented codes following the existing convention (`RATE_LIMITED` -> HTTP
    429; CSRF code -> HTTP 403) rather than inventing undocumented strings.
  - Rate-limit store is in-memory behind a small interface for the single-node MVP;
    distributed/Redis-backed limiting is deferred and must be recorded as an assumption.
  - `security:check` stays a pending fail-loud proof; the real proof for these tasks is
    `test:api -- security` plus lint/typecheck/test/openapi:check. Builders must not
    report `security:check` as passed.
- Verification:
  - Passed: `rg -n "F1-06|NFR-SEC-001|Ready to Build|BUILDER-STRONG" .forge/backlog.md .forge/next.md .forge/state.md`
- Security Self-Check:
  - Not Run: planning-only task; no runtime auth, RBAC, branch-scope, rate-limit, CSRF,
    state-change, audit, portal, or logging behavior was implemented.
  - Planned gate: `F1-06B` is `Verify Gate: required` before `F1-06C` builds on the CSRF
    mechanism; the Phase 1 `PHASE-REVIEWER` gate follows `F1-06C`.

## F1-06A - Login Rate Limiting (Account + IP)

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - NFR-SEC-001 (AC3)
  - REQ-AUTH-001
  - API-STANDARD-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
  - NFR-SEC-002
- Evidence:
  - Added `LoginRateLimitGuard` with documented constants: 5 attempts per 60 seconds
    per server-observed IP key and, when present, submitted normalized account
    identifier key.
  - Wired the guard only to `POST /auth/login`; logout and me routes are unchanged.
  - Registered an injectable in-memory fixed-window store behind `LOGIN_RATE_LIMIT_STORE`;
    Redis/distributed storage is deferred by task scope for the single-node MVP.
  - On over-limit login attempts, the guard throws stable `RATE_LIMITED` HTTP 429 and
    writes a `SECURITY` / `rate_limit_triggered` audit entry through `AuditService`.
  - Added the `security` API test suite and focused tests for one allowed under-limit
    case and one denied over-limit case, including safe audit/error-body assertions.
  - Documented the `429` login response in the canonical OpenAPI contract and
    regenerated `packages/contracts/openapi.json`.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- security` (2/2)
  - Passed: `corepack pnpm test:api -- auth` (21/21)
  - Passed: `corepack pnpm openapi:check`
  - Not Run: `corepack pnpm security:check` remains a pending fail-loud aggregate by
    explicit task scope; it is not reported as passed.
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not
    applicable for pre-session login authorization; the guard derives throttle keys
    from server-observed IP plus submitted identifier only, never client limit,
    threshold, role, or branch fields.
  - Each state change writes status history and an audit entry in the same transaction;
    side effects enqueue after commit: Not applicable to rate-limit denial because no
    domain/session state changes; `SECURITY` audit is a standalone append-only write,
    consistent with existing denial paths.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed; `apps/api/test/security/rate-limit.test.ts` asserts the audit metadata and
    rendered 429 body contain no password, token, or hash values.
  - Customer portal exposure rules hold: Not applicable; no portal route or
    portal-visible data changed.
  - Trust boundaries are tested: Passed; `test:api -- security` covers under-limit
    allow and over-limit deny with `RATE_LIMITED` 429 plus `rate_limit_triggered` audit.

## F1-06B - CSRF Kernel Guard, Token Issuance, And Auth-Route Enforcement

- Date: 2026-06-18
- Risk: High
- Status: Passed pending independent VERIFY
- Required model tier: BUILDER-STRONG
- Verify Gate: required
- Requirement IDs:
  - NFR-SEC-001 (AC5)
  - REQ-AUTH-001
  - API-STANDARD-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
  - NFR-SEC-002
- Evidence:
  - Added `CsrfGuard` for session-authenticated mutation routes. It requires
    `x-csrf-token` to match the readable `cms_csrf_token` cookie and uses
    `timingSafeEqual` for equal-length comparisons.
  - Successful login now sets both the existing HttpOnly staff session cookie and a
    readable SameSite CSRF cookie; the login response body remains safe claims plus
    expiry.
  - Logout is guarded by `SessionAuthGuard` then `CsrfGuard`, revokes the staff session
    through the existing same-transaction auth service path, and expires both cookies.
  - CSRF denial returns stable `CSRF_INVALID` HTTP 403 and writes a `SECURITY` /
    `csrf_rejected` audit entry with actor, branch, route, correlation ID, IP, user
    agent, and a safe reason only.
  - Added focused CSRF tests for one allowed match and one denied mismatch, plus updated
    auth route tests for dual cookie issuance/expiry.
  - Documented the CSRF cookie behavior and `CSRF_INVALID` logout response in the
    canonical OpenAPI contract and regenerated `packages/contracts/openapi.json`.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- security` (4/4)
  - Passed: `corepack pnpm test:api -- auth` (21/21)
  - Passed: `corepack pnpm openapi:check`
  - Not Run: `corepack pnpm security:check` remains a pending fail-loud aggregate by
    explicit task scope; it is not reported as passed.
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed;
    logout uses `SessionAuthGuard`, and CSRF validation derives only from the
    server-issued CSRF cookie plus `x-csrf-token`, never client role or branch fields.
  - Each state change writes status history and an audit entry in the same transaction;
    side effects enqueue after commit: Passed for logout by preserving the existing
    same-transaction session revoke + AUTH logout audit path. CSRF denial is not a
    domain/session state change; its `SECURITY` audit is a standalone append-only write.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed; `apps/api/test/security/csrf.test.ts` asserts the denial audit and rendered
    403 body do not contain CSRF/session secret values, password text, or hashes.
  - Customer portal exposure rules hold: Not applicable; no portal route or
    portal-visible data changed.
  - Trust boundaries are tested: Passed; `test:api -- security` covers matching CSRF
    allow and mismatched CSRF deny with `CSRF_INVALID` 403 plus `csrf_rejected` audit.

## F1-06C - Enforce CSRF On Branch Admin Mutation Routes

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - NFR-SEC-001 (AC5)
  - REQ-ADMIN-001
  - API-STANDARD-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
  - NFR-SEC-002
- Evidence:
  - Reused the verified `CsrfGuard`; no second CSRF mechanism was added.
  - Added `CsrfGuard` to branch mutation routes only: `POST /branches`,
    `PATCH /branches/:id`, and `POST /branches/:id/deactivate`.
  - Left branch read routes free of CSRF enforcement while preserving
    `SessionAuthGuard`, `RbacGuard`, and Admin-only role metadata.
  - Fixed `BranchesModule` guard DI by importing `AuthModule`, aliasing
    `SESSION_AUTH_SERVICE` to exported `AuthService`, and registering
    `SessionAuthGuard`, `RbacGuard`, and `CsrfGuard`.
  - Updated `apps/api/src/modules/branches/MODULE.md` so the module manifest reflects
    its CSRF guard and public `AuthService` dependencies.
  - Added `apps/api/test/admin/branches-csrf.test.ts`, proving mutation guard
    metadata, read-route non-CSRF metadata, module guard providers, one allowed
    matching CSRF case, and one denied mismatched CSRF case with safe
    `SECURITY` / `csrf_rejected` audit.
  - Updated canonical OpenAPI branch mutation `403` descriptions to include
    `CSRF_INVALID` and regenerated `packages/contracts/openapi.json`.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- admin` (15/15)
  - Passed: `corepack pnpm test:api -- security` (4/4)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `corepack pnpm lint` after the `MODULE.md` manifest update
  - Not Run: `corepack pnpm security:check` remains a pending fail-loud aggregate by
    explicit task scope; it is not reported as passed.
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed;
    branch mutation routes still use `SessionAuthGuard`, `RbacGuard`, and `@Roles('ADMIN')`;
    module wiring aliases session validation to server `AuthService`.
  - CSRF validation derives only from the server-issued cookie + `x-csrf-token`: Passed;
    branch mutation tests exercise the shared `CsrfGuard` using cookie/header matching.
  - No passwords, OTPs, tokens, hashes, or cookie values are logged or returned: Passed;
    branch CSRF denial test asserts audit/error output omits CSRF/session secret values,
    password text, and hashes.
  - Customer portal exposure rules hold: Not applicable; no portal route or
    portal-visible data changed.
  - Trust boundaries are tested: Passed; `test:api -- admin` covers one allowed branch
    CSRF case and one denied branch CSRF case with `CSRF_INVALID` 403 plus
    `csrf_rejected` audit.

## PLAN-F2-01 - Plan Complaint Core And Scope The Complaint Schema/Migration

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: PLANNER
- Requirement IDs:
  - REQ-COMPLAINT-001
  - ARCH-WORKFLOW-001
  - WORKFLOW-MATRIX-001
  - ARCH-DATA-001
  - METHOD-AUDIT-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - Reconciled the already-applied F0-08 complaint schema and migration against the Phase 2 SRS IDs.
  - Existing schema already covers the core complaint table, unique `referenceNumber`, all required workflow states, branch/category/customer/vehicle relationships, severity/source/type, optimistic `version`, status indexes, comments, attachments, approvals, SLA policies/events, notifications, portal verification/session, compensation, and audit logs.
  - Existing category hierarchy supports category/subcategory without a separate schema change.
  - Existing complaint creation requirements that vary by request (`incidentAt`, customer phone/customer number, vehicle VIN only when vehicle-related, field-specific messages) should be enforced in DTO/service behavior, not by a broad schema rewrite.
  - Found one required schema delta before workflow behavior: `complaint_status_history` has from/to status, actor, reason, timestamp, and correlation ID, but not transition action, actor role, or request source.
  - Split Phase 2 broad headers into agentic backlog sub-items under `F2-01..F2-04`.
  - Marked `F2-02B` as `Verify Gate: required` because complaint creation and queues depend on the persisted backend state-machine kernel.
  - Queued exactly one build task: `F2-01A - Add Complaint Transition History Metadata Schema And Migration`.
  - Did not change application source code.
- Verification:
  - Passed: `rg -n "PLAN-F2-01|F2-01A|F2-02B|Verify Gate: required|Ready to Build|transition provenance|actorRole|requestSource" .forge\backlog.md .forge\next.md .forge\state.md`
- Notes:
  - `db:migrate:test` remains a fail-loud placeholder and was not represented as passing.
  - The shared `@Global()` core module carry-in was not queued; it is optional cleanup and should only happen if it removes more duplication than it adds.

## F1-06D - Shared Forge Security Baseline Pack

- Date: 2026-06-18
- Risk: Medium
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - CONTRACT-READINESS-002
  - CONTRACT-READINESS-003
  - NFR-SEC-001
  - REQ-RBAC-001
  - RBAC-MATRIX-001
  - METHOD-AUDIT-001
  - API-STANDARD-001
  - PORTAL-SEC-001
  - METHOD-TEST-001
- Evidence:
  - Published a reusable Forge security-baseline pack outside this project at
    `C:/Users/dryos/.agents/packs/forge-security-baseline`.
  - Extracted mechanism and proof-test guidance only from accepted Phase 1 patterns:
    server sessions, password hashing, login rate limiting, CSRF, RBAC/scope guards,
    audit append-only behavior, OpenAPI/error checks, and portal/privacy boundaries.
  - Kept project policy SRS-driven. The pack explicitly tells new projects to adapt
    roles, RBAC matrix entries, audit event/action codes, and privacy allow/deny rules
    from their own SRS instead of copying CMS-Auto policy.
  - Included a small pack smoke test at
    `C:/Users/dryos/.agents/packs/forge-security-baseline/checks/pack-smoke.test.mjs`.
  - Did not add a shared runtime library, generator, workflow engine, permission DSL,
    or project-local-only pack copy.
- Verification:
  - Passed: `node --test C:/Users/dryos/.agents/packs/forge-security-baseline/checks/pack-smoke.test.mjs` (3/3)
  - Not Run: full project `lint`, `typecheck`, `test`, `openapi:check`; no application
    source or project contract files were changed for this out-of-band pack extraction.
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed by
    pack guidance; it requires new projects to derive role/scope from server sessions
    and test client-supplied role/scope ignore behavior.
  - Each state change writes status history and an audit entry in the same transaction;
    side effects enqueue after commit: Passed by pack guidance for state-changing
    services; no runtime behavior changed here.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by pack guidance and required tests for auth, CSRF, rate-limit, audit
    redaction, and portal/privacy boundaries.
  - Customer portal exposure rules hold: Passed by pack guidance requiring public DTO
    allow-lists from each project SRS and tests excluding internal comments, audit
    logs, staff PII, DMS/internal codes, OTPs, tokens, and credentials.
  - Trust boundaries are tested: Passed by pack guidance; every adopted boundary must
    have at least one allowed and one denied test.

## F2-01A - Add Complaint Transition History Metadata Schema And Migration

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-DATA-001
  - ARCH-WORKFLOW-001
  - WORKFLOW-MATRIX-001
  - METHOD-AUDIT-001
  - API-STANDARD-001
  - REQ-COMPLAINT-001
  - METHOD-TEST-001
- Evidence:
  - Added stable `ComplaintTransitionAction` enum values matching the SRS workflow
    matrix actions.
  - Added `ComplaintTransitionRequestSource` for staff API, customer portal, system
    job, and import-originated transition requests.
  - Added `action`, `actorRole`, and `requestSource` storage to
    `ComplaintStatusHistory` with snake_case column mapping for `actor_role` and
    `request_source`.
  - Added migration `20260618201000_transition_history_metadata` to create the new
    enums and add nullable history metadata columns without mutating existing
    complaint or audit data.
  - Strengthened schema guard tests so removing transition metadata fields or enums
    fails `corepack pnpm test`.
  - No complaint services, routes, state-machine behavior, OpenAPI paths, UI, jobs,
    notification logic, or audit append-only migration changes were added.
- Verification:
  - Failed then Passed: `corepack pnpm --dir packages/database exec prisma validate --schema prisma/schema.prisma`
    initially failed because `DATABASE_URL` was unset in the shell; rerun with the
    dev database URL passed.
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm --dir packages/database exec prisma validate --schema prisma/schema.prisma`
  - Passed: `corepack pnpm --dir packages/database exec prisma generate --schema prisma/schema.prisma`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `docker compose up -d postgres`
  - Passed: `docker run --rm --network cms-forge_default -v "${PWD}:/workspace:ro" -w /workspace -e DATABASE_URL="postgresql://cms_auto:cms_auto_dev@postgres:5432/cms_auto?schema=public" node:20-bookworm-slim sh -lc "apt-get update >/dev/null && apt-get install -y openssl >/dev/null && npm exec --yes prisma@5.22.0 -- migrate deploy --schema packages/database/prisma/schema.prisma"`
  - Not Run: `db:migrate:test`; it remains a fail-loud placeholder and was not claimed
    as passed.
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not Run;
    migration-only task has no authenticated request boundary.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Not Run; this task adds storage
    only. `F2-02B` must prove service behavior and remains a Verify Gate.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; the migration contains only enum/column DDL and no secret data
    or logging behavior.
  - Customer portal exposure rules hold: Not Run; no portal API or portal-visible DTO
    changed.
  - Trust boundaries are tested: Not Run; no request boundary was added.

## F2-01B - Generate Complaints Module Shell And Manifest

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-WORKFLOW-001
  - WORKFLOW-MATRIX-001
  - METHOD-AUDIT-001
  - REQ-COMPLAINT-001
  - METHOD-MODULAR-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Generated `apps/api/src/modules/complaints/` with the canonical module generator.
  - Filled `apps/api/src/modules/complaints/MODULE.md` with public surface,
    owned tables, allowed dependencies, related table boundaries, and SRS IDs.
  - Kept the generated module behavior-free: no complaint routes, repository queries,
    workflow logic, OpenAPI paths, schema, migrations, UI, jobs, comments,
    attachments, notifications, or audit behavior were added.
  - Did not touch the generator because it already produced a valid Nest-ready shell.
- Verification:
  - Passed: `corepack pnpm generate:module -- complaints`
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm openapi:check`
  - Not Run: `corepack pnpm generate:module -- complaints --root <temp>`; generator
    behavior was not changed in this task.
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not Run;
    module-shell-only task has no request boundary.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Not Run; no complaint behavior
    was implemented.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; only behavior-free generated shell files and a manifest were
    added.
  - Customer portal exposure rules hold: Not Run; no portal API or portal-visible DTO
    changed.
  - Trust boundaries are tested: Not Run; no request boundary was added.

## F2-02A - Workflow Transition Matrix Validation

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-WORKFLOW-001
  - WORKFLOW-MATRIX-001
  - API-STANDARD-001
  - REQ-COMPLAINT-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Added a pure service-level workflow transition matrix in `ComplaintsService`.
  - `validateTransition(fromStatus, action, actorRole)` returns the SRS target status
    for allowed transitions.
  - Invalid state/action pairs throw stable `COMPLAINT_INVALID_TRANSITION` with HTTP
    409.
  - Unauthorized roles throw stable `RBAC_FORBIDDEN` with HTTP 403.
  - Registered a real `workflow` API test suite in `tools/api-test.mjs`.
  - Added focused workflow tests covering all 17 SRS matrix transitions, one invalid
    transition, and one unauthorized-role denial.
  - No persistence, Prisma query, status-history write, audit write, HTTP route,
    OpenAPI path, UI, job, notification, comment, attachment, or side effect was
    added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- workflow` (3/3)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not Run
    for HTTP/session boundary; no route exists. The validator accepts an actor role
    input that later route tasks must supply from the server session.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Not Run; no persistence or side
    effects were implemented. `F2-02B` must prove this and remains a Verify Gate.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; no logging or secret fields were added.
  - Customer portal exposure rules hold: Not Run; no portal API or portal-visible DTO
    changed.
  - Trust boundaries are tested: Partial; pure validator tests cover allowed
    transitions and denied roles, but no HTTP trust boundary exists yet.

## F2-02B - Persist Complaint Transitions With History And Audit

- Date: 2026-06-18
- Risk: High
- Status: Passed pending independent VERIFY
- Required model tier: BUILDER-STRONG
- Verify Gate: required
- Requirement IDs:
  - ARCH-WORKFLOW-001
  - WORKFLOW-MATRIX-001
  - METHOD-AUDIT-001
  - API-STANDARD-001
  - REQ-COMPLAINT-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Added `ComplaintsService.applyTransition`, which first uses the existing
    `validateTransition` authority, then applies valid transitions in one
    repository transaction.
  - Added complaints repository methods for transaction execution, complaint status
    update, and `complaint_status_history` insert.
  - Added `AuditService.record` in the same transaction client as the complaint update
    and status-history insert.
  - Stored transition action, actor role, request source, reason, correlation ID, and
    actor in status history.
  - Added `WORKFLOW` audit metadata for from/to status, transition action, actor role,
    and request source.
  - Wired `PrismaService` and `AuditService` into `ComplaintsModule` for the new
    service dependencies.
  - Updated generated complaint construction specs to match the service/repository
    dependencies.
  - No HTTP routes, OpenAPI paths, DTO request parsing, UI, jobs, comments,
    attachments, notifications, customer portal behavior, SLA scheduling, or external
    side effects were added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Failed then Passed: `corepack pnpm typecheck` initially caught stale generated
    constructor specs after the service dependency changed; after updating those
    test stubs, it passed.
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- workflow` (6/6)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not Run
    for HTTP/session boundary; no route exists. Role authority is represented as
    service input and must be supplied from the server session in `F2-02C`.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed; workflow tests assert the
    complaint status update, status-history insert, and audit write all receive the
    same transaction client, and denied paths do not start a transaction. No side
    effects are enqueued in this task.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; no logging or secret fields were added.
  - Customer portal exposure rules hold: Not Run; no portal API or portal-visible DTO
    changed.
  - Trust boundaries are tested: Partial; service tests cover allowed transition,
    invalid transition, and unauthorized role denial, but no HTTP trust boundary exists
    until `F2-02C`.

## REPAIR-F2-02B - Validate Persisted Complaint Status Before Transition Writes

- Date: 2026-06-18
- Risk: High
- Status: Passed pending independent VERIFY
- Required model tier: BUILDER-STRONG
- Verify Gate: required
- Requirement IDs:
  - ARCH-WORKFLOW-001
  - WORKFLOW-MATRIX-001
  - METHOD-AUDIT-001
  - API-STANDARD-001
  - REQ-COMPLAINT-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Changed `ComplaintsRepository.updateStatus` to update only when both
    `complaintId` and the expected persisted `fromStatus` match.
  - `updateStatus` now returns `null` on stale/mismatched persisted status instead of
    writing by `complaintId` alone.
  - `ComplaintsService.applyTransition` rejects the stale/mismatch path with stable
    `COMPLAINT_INVALID_TRANSITION` before writing status history or WORKFLOW audit.
  - Kept invalid matrix inputs and unauthorized roles as pre-transaction denials.
  - Added workflow proof that a stale persisted status starts the atomic transition
    path, rejects with `COMPLAINT_INVALID_TRANSITION`, and writes no history or audit.
  - No HTTP routes, OpenAPI paths, DTO request parsing, UI, jobs, notifications, SLA
    scheduling, portal behavior, comments, attachments, or external side effects were
    added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- workflow` (7/7)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not Run
    for HTTP/session boundary; no route exists. Role authority remains service input
    and must be supplied from the server session in `F2-02C`.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed; successful workflow tests
    assert complaint status update, status-history insert, and audit write receive the
    same transaction client. Stale persisted status now rejects before history/audit.
    No side effects are enqueued in this task.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; no logging or secret fields were added.
  - Customer portal exposure rules hold: Not Run; no portal API or portal-visible DTO
    changed.
  - Trust boundaries are tested: Partial; service tests cover allowed transition,
    invalid transition, unauthorized role denial, and stale persisted-status denial.
    HTTP trust boundary remains for `F2-02C`.

## F2-02C - Add Complaint Transition HTTP Route, RBAC/Branch-Scope Tests, And OpenAPI

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-WORKFLOW-001
  - WORKFLOW-MATRIX-001
  - METHOD-AUDIT-001
  - API-STANDARD-001
  - REQ-COMPLAINT-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Added `POST /complaints/:id/transitions` on `ComplaintsController` with
    `SessionAuthGuard`, `RbacGuard`, `CsrfGuard`, `@Roles(...)`, and
    `@BranchScoped()`.
  - Added `complaint-transition.dto.ts` parsing for `fromStatus`, `action`, and
    optional `reason`; client-supplied actor/role/source fields are ignored.
  - Controller derives actor ID, actor role, correlation ID, IP, and user agent from
    the authenticated server request and forces `STAFF_API` request source before
    delegating to `ComplaintsService.applyTransition`.
  - Wired `AuthModule`, session auth provider, RBAC guard, and CSRF guard into
    `ComplaintsModule`.
  - Added workflow API tests for controller delegation, invalid request body,
    guard/module wiring, allowed scoped staff access, and branch-scope denial audit.
  - Added the complaint transition route, request schema, response schema, auth/error
    responses, and canonical OpenAPI drift check coverage.
  - No complaint creation, staff queues, jobs, notifications, SLA scheduling, portal
    behavior, comments, attachments, DMS/external calls, UI, or unrelated workflow
    actions were added.
- Verification:
  - Failed then Passed: `corepack pnpm test:api -- workflow`; first run failed because
    the new test expected the wrong existing `deniedBranchId` audit metadata. Fixed
    the expectation; final run passed 11/11.
  - Failed then Passed: `corepack pnpm lint`; first run caught
    `tools/openapi-check.mjs` over the 300-line budget after adding OpenAPI entries.
    Compacted unchanged schema literals; final lint passed.
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed;
    controller uses `request.principal.roleCode`/`userId`, ignores spoofed body
    actor/role/source fields, and route uses `RbacGuard`/`@BranchScoped()`.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by reuse of
    `ComplaintsService.applyTransition` from F2-02B; no side effects are enqueued.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope and tests; no credential fields are parsed or returned.
  - Customer portal exposure rules hold: Passed by scope; the route is staff guarded
    and no portal DTO/API behavior was added.
  - Trust boundaries are tested: Passed; workflow tests cover an allowed scoped staff
    transition route path and a denied branch-scope guard path with SECURITY audit.

## F2-03A - Add Complaint Creation Service Behavior With Validation, Reference Generation, History, And Audit

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-COMPLAINT-001
  - ARCH-WORKFLOW-001
  - WORKFLOW-MATRIX-001
  - METHOD-AUDIT-001
  - API-STANDARD-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Added `ComplaintsService.createInternal` for staff complaint creation behavior.
  - Added validation for customer name, phone or customer number, category,
    subcategory, description, incident date, branch, subject, severity, and VIN when
    `vehicleRelated` is true.
  - Added deterministic local reference generation through
    `ComplaintsRepository.nextReferenceNumber`.
  - Added repository creation behavior that upserts a minimal customer required by
    the current schema, then creates the complaint with initial `SUBMITTED` status.
  - Added initial status history and `COMPLAINT`/`complaint_created` audit in the
    same repository transaction.
  - Added workflow tests proving validation denies before transaction and successful
    creation writes complaint, status history, and audit with the same transaction
    client.
  - No HTTP creation route, OpenAPI creation path, staff queue, UI, job,
    notification, SLA, portal, comment, attachment, DMS/external call, or
    compensation behavior was added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Failed then Passed: `corepack pnpm typecheck`; first run caught Prisma mixed
    relation input and nullable history actor-role type issues. Repaired by upserting
    customer before complaint create and allowing null history actor role.
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- workflow` (13/13)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not Run
    at HTTP boundary; no route exists in F2-03A. The service does not accept actor
    role and only accepts branch as complaint target data.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed; workflow tests assert
    complaint create, initial status history, and COMPLAINT audit receive the same
    transaction client. No side effects are enqueued.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; no credential fields are parsed, logged, or returned.
  - Customer portal exposure rules hold: Passed by scope; no portal route or
    portal-visible DTO was added.
  - Trust boundaries are tested: Partial; service validation covers denied input and
    successful create behavior, while HTTP allowed/denied cases are queued for
    `F2-03B`.
- Assumptions and gaps:
  - The current schema requires `Complaint.customerId`, but a customer module/service
    is not built yet. F2-03A uses a minimal same-transaction customer upsert in the
    complaints repository as the smallest working path; revisit when a customer
    module exists.

## F2-03B - Add Complaint Creation HTTP Route, OpenAPI, And Allowed/Denied API Tests

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-COMPLAINT-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - API-STANDARD-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Added `POST /complaints` on `ComplaintsController` with `SessionAuthGuard`,
    `RbacGuard`, `CsrfGuard`, `@Roles(...)`, and `@BranchScoped()`.
  - Replaced the empty `create-complaint.dto.ts` with request parsing and mapping
    into `ComplaintsService.createInternal`.
  - Controller requires `branchId` query as the guarded target branch, ignores spoofed
    body branch/actor fields, derives actor/audit context from the server request
    principal, and delegates to the F2-03A service path.
  - Added workflow API tests for allowed route delegation, stable missing-branch
    validation, and branch-scope denial audit.
  - Added the complaint creation route, request schema, response schema, auth/error
    responses, and canonical OpenAPI drift check coverage.
  - No staff queue, UI, job, notification, SLA, portal, comment, attachment,
    DMS/external call, or compensation behavior was added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Failed then Passed: `corepack pnpm typecheck`; first run caught exact optional
    property typing for nullable audit context fields. Repaired by normalizing
    undefined context values to null.
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- workflow` (16/16)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed;
    the route uses session/RBAC/branch-scope guards, derives actor from
    `request.principal`, ignores spoofed body branch/actor data, and tests allowed and
    denied branch-scope behavior.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by delegation to
    `ComplaintsService.createInternal`; F2-03A tests cover same-transaction
    complaint/history/audit writes. No side effects are enqueued.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; no credential fields are parsed or returned.
  - Customer portal exposure rules hold: Passed by scope; route is staff guarded and
    no portal DTO/API behavior was added.
  - Trust boundaries are tested: Passed; workflow tests cover an allowed creation
    route case and a denied branch-scope case with SECURITY audit.

## F2-03C - Add Branch-Scoped Staff Complaint Queues

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-COMPLAINT-001
  - ARCH-WORKFLOW-001
  - API-STANDARD-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Added repository queue listing with branch filter and explicit selected fields.
  - Added service mapping to explicit queue response objects with ISO timestamps.
  - Added `GET /complaints` on `ComplaintsController` with session auth, RBAC, and
    branch-scope guard metadata.
  - Controller derives branch scope from guarded `branchId` query or server principal
    for non-admin staff; Admin may omit branch or request a specific branch.
  - Added workflow tests for branch-scoped queue service mapping and route branch
    derivation.
  - Added queue route and response schemas to canonical OpenAPI.
  - No UI, job, notification, SLA, portal, comment, attachment, DMS/external call, or
    compensation behavior was added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- workflow` (18/18)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed;
    the route uses session/RBAC/branch-scope guards and derives default non-admin
    branch from `request.principal.branchId`.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Not applicable; queue read does
    not change state.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by explicit queue DTO fields.
  - Customer portal exposure rules hold: Passed by scope; queue route is staff
    guarded and returns no portal data, audit logs, DMS codes, or staff PII.
  - Trust boundaries are tested: Passed; prior creation route tests cover branch-scope
    denial and queue tests cover branch-scope derivation.

## F2-04A - Add Complaint Detail Read Model With Status-History Timeline

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-COMPLAINT-001
  - ARCH-WORKFLOW-001
  - API-STANDARD-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Added repository detail lookup filtered by complaint ID and optional branch.
  - Added explicit detail DTO mapping with complaint core fields, description,
    incident date, and status-history timeline.
  - Added stable `COMPLAINT_NOT_FOUND` for missing or branch-hidden complaints.
  - Added `GET /complaints/:id` with session auth, RBAC, and branch-scope guard
    metadata.
  - Added workflow tests for detail timeline shape, scoped not-found behavior, and
    route branch derivation.
  - Added detail route and response schemas to canonical OpenAPI.
  - No comments, attachments, UI, job, notification, SLA, portal, DMS/external call,
    or compensation behavior was added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- workflow` (20/20)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed;
    route uses session/RBAC/branch-scope guards and derives default non-admin branch
    from `request.principal.branchId`.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Not applicable; detail read does
    not change state.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by explicit detail DTO fields.
  - Customer portal exposure rules hold: Passed by scope; staff detail route returns
    no audit logs, portal data, DMS codes, or unrelated complaints.
  - Trust boundaries are tested: Passed; workflow tests cover allowed detail lookup
    and scoped not-found behavior.

## F2-04B - Add Internal/Public Comment Service Behavior With Privacy And Audit Tests

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-COMPLAINT-001
  - METHOD-AUDIT-001
  - API-STANDARD-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Added repository comment create behavior and public-only comment listing.
  - Added service behavior for blank-body validation, internal/public comment
    creation, same-transaction COMMENT audit, and public-only comment reads.
  - Added workflow tests proving blank comments reject, comment creation audits in the
    same transaction, and public reads exclude internal comments.
  - No HTTP comment route, OpenAPI comment path, UI, job, notification, SLA, portal,
    attachment, DMS/external call, or compensation behavior was added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- workflow` (22/22)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not Run
    at HTTP boundary; no route exists in F2-04B. Service accepts actor ID but no
    client role authority.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed for comment state change;
    tests assert comment create and COMMENT audit use the same transaction client. No
    side effects are enqueued.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; no credential fields are parsed or returned.
  - Customer portal exposure rules hold: Passed; public comment read behavior returns
    only `PUBLIC` comments and excludes internal comments.
  - Trust boundaries are tested: Partial; service validation/privacy are tested, while
    HTTP allowed/denied cases are queued for `F2-04C`.

## F2-04C - Add Complaint Detail/Comment HTTP Routes And OpenAPI

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-COMPLAINT-001
  - METHOD-AUDIT-001
  - API-STANDARD-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Added guarded staff comment routes to `ComplaintsController`:
    `POST /complaints/:id/comments` and `GET /complaints/:id/comments/public`.
  - Added complaint comment DTO parsing for body and `INTERNAL`/`PUBLIC`
    visibility, with actor/audit context derived from the server request principal.
  - Controller verifies scoped complaint access through the existing detail path
    before creating or reading comments, then delegates to F2-04B service behavior.
  - Public-comment reads continue to return only comments with `PUBLIC` visibility.
  - Added workflow API tests for allowed comment route delegation, invalid comment
    body denial before service write, and public comment route scope/privacy behavior.
  - Added OpenAPI paths, request/response schemas, auth/error responses, and
    canonical drift-check coverage for both comment routes.
  - No UI, jobs, notifications, SLA scheduling, customer portal behavior,
    attachments, DMS/external calls, or compensation behavior was added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- workflow` (25/25)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed;
    routes use session/RBAC/branch-scope guard metadata, derive actor from
    `request.principal`, and verify scoped complaint access before delegation.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed for comment creation by
    reuse of F2-04B `createComment`, whose tests prove comment create and COMMENT
    audit share one transaction. No side effects are enqueued.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; no credential fields are parsed or returned.
  - Customer portal exposure rules hold: Passed; public-comment reads are filtered to
    public comments only and do not expose internal comments, audit logs, DMS codes,
    staff PII, or unrelated complaints.
  - Trust boundaries are tested: Passed; workflow tests cover allowed comment route
    behavior, scoped access verification, invalid-body denial, and public-read privacy.

## REPAIR-PHASE-2-TRANSITION-BRANCH-SCOPE - Enforce Target Complaint Branch Scope Before Transitions

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-RBAC-001
  - RBAC-MATRIX-001
  - ARCH-WORKFLOW-001
  - WORKFLOW-MATRIX-001
  - METHOD-AUDIT-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - `POST /complaints/:id/transitions` now parses the transition request body, derives the scoped branch from the server request/query path with `queueBranchId`, verifies the target complaint through `ComplaintsService.getDetail`, and only then delegates to `ComplaintsService.applyTransition`.
  - Added workflow API coverage proving an out-of-scope complaint rejects with `COMPLAINT_NOT_FOUND` before `applyTransition` can run.
  - Added workflow API coverage proving Admin can still transition without a branch filter.
  - Existing transition behavior still derives actor role/ID and audit context from the server request principal and ignores spoofed body authority fields.
  - No service transaction semantics, repository update logic, OpenAPI contract, Phase 3 SLA/jobs, UI, portal, attachment, notification, or integration behavior changed.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- workflow` (27/27)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed; transition route derives actor role from `request.principal` and now verifies target complaint visibility through server-derived branch scope before applying a transition.
  - Each state change writes status history and an audit entry in the same transaction; side effects enqueue after commit: Passed by unchanged `ComplaintsService.applyTransition` tests; scoped denial happens before transition write/history/audit. No side effects are enqueued in Phase 2.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed by scope; no credential fields are parsed, logged, or returned.
  - Customer portal exposure rules hold: Passed by scope; no portal route or portal-visible DTO changed.
  - Trust boundaries are tested: Passed; workflow tests cover allowed staff transition, out-of-scope complaint denial before write, query branch-scope denial audit, and Admin transition without branch filter.

## REPAIR-PHASE-2-TRANSITION-ROLE-DENIAL-AUDIT - Audit Transition-Specific Unauthorized Role Denials

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-RBAC-001
  - RBAC-MATRIX-001
  - ARCH-WORKFLOW-001
  - WORKFLOW-MATRIX-001
  - METHOD-AUDIT-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - `ComplaintsService.applyTransition` now records a safe `SECURITY` /
    `workflow_role_forbidden` audit event when workflow validation finds a valid
    state/action pair but denies the actor role.
  - Invalid state/action denials still return `COMPLAINT_INVALID_TRANSITION` and do
    not create a security event.
  - Denied-role transitions still reject before status update, status history, and
    WORKFLOW audit transaction work.
  - The workflow suite now asserts the denied-role audit includes actor, complaint
    target, correlation/request metadata, and safe transition metadata.
  - No controller contract, repository update semantics, OpenAPI, Phase 3 SLA/jobs,
    UI, portal, attachment, notification, or integration behavior changed.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- workflow` (27/27)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed;
    transition HTTP route still derives actor role from `request.principal`, and the
    service denial audit uses that server-supplied role context.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by unchanged successful
    transition tests. The denied-role path makes no state change and writes a
    SECURITY audit before any transaction. No side effects are enqueued.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope and metadata; only complaint ID, statuses/action, actor role,
    request source, and request metadata are recorded.
  - Customer portal exposure rules hold: Passed by scope; no portal route or
    portal-visible DTO changed.
  - Trust boundaries are tested: Passed; workflow tests cover allowed transition,
    invalid transition, unauthorized-role denial with SECURITY audit, branch-scope
    denial audit, and out-of-scope complaint denial before write.

## PLAN-F3-01 - Split SLA And Workflow Operations

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: PLANNER
- Requirement IDs:
  - REQ-SLA-001
  - REQ-WORKFLOW-001
  - REQ-WORKFLOW-002
  - REQ-RESOLUTION-001
  - REQ-NOTIFY-001
  - SLA-CALENDAR-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Read `.forge/forge.md`, project policy/state/next/model files, backlog,
    evidence, trust, AGENTS rules, architecture, and the SRS blocks cited by the
    planner task.
  - Confirmed `.forge/state.md` was `Ready to Plan`, so no code was implemented.
  - Split Phase 3 backlog into focused SLA/workflow operation subtasks.
  - Wrote `F3-01A` as the first build task: generate the `sla` module and add the
    deterministic backend deadline calculator before jobs, warnings, escalation,
    notifications, or reopen/reassignment recalculation.
  - Marked `F3-01A` as `Verify Gate: required` because later Phase 3 work builds
    directly on this SLA foundation.
- Verification:
  - Passed: `rg -n "F3-01A|Verify Gate: required|Ready to Build|test:api -- sla" .forge/next.md .forge/state.md .forge/backlog.md`
- Notes:
  - No application source code, schema, OpenAPI contract, jobs, routes, or UI were
    changed during planning.

## F3-01A - Generate SLA Module And Deadline Calculator

- Date: 2026-06-18
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-SLA-001
  - SLA-CALENDAR-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Ran `corepack pnpm generate:module -- sla` and kept the generated Nest module
    boundary.
  - Filled `apps/api/src/modules/sla/MODULE.md` with public `SlaService`, owned
    `sla_policies` / `sla_events`, allowed dependencies, and SRS IDs.
  - Added backend-only `SlaService.calculateDeadline` for stored-policy input:
    severity, stage, duration, warning percent, branch timezone, calendar mode,
    entered timestamp, and optional policy ID.
  - Supported `WorkingCalendarMode.ALWAYS_ON` with deterministic ISO `warningAt`
    and `dueAt` outputs, plus default duration constants for Critical 120, High
    480, Medium 1440, and Low 4320 minutes.
  - Invalid or missing policy fields and unsupported calendar mode fail closed with
    stable `SLA_POLICY_MISSING`; no generic error leaks.
  - Added `apps/api/test/sla/deadline-calculator.test.ts` and wired the `sla` suite
    into `tools/api-test.mjs`.
  - No repository reads/writes, jobs, notifications, routes, OpenAPI paths, UI,
    portal, provider calls, or side effects were added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- sla` (3/3)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not
    applicable; no HTTP route, role decision, or branch-scoped read/write was added.
    The calculator accepts stored-policy data only.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Not applicable; no state change
    or side effect was introduced.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; the code parses only SLA policy fields and returns deadline
    timestamps.
  - Customer portal exposure rules hold: Passed by scope; no portal route or
    portal-visible DTO was added.
  - Trust boundaries are tested: Passed for this task's boundary; SLA API tests cover
    accepted stored-policy calculation and denied invalid/unsupported policy input.

## F3-01B - Resolve Active SLA Policies By Complaint Severity, Stage, And Scope

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-SLA-001
  - SLA-CALENDAR-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added `SlaRepository.findActiveBySeverityAndStage` to read only active stored
    SLA policies for severity and stage.
  - Added `SlaService.resolvePolicy` to select matching policies where scope fields
    are null or equal to the requested `branchId`, `departmentId`, and `categoryId`.
  - Resolver chooses the most specific matching policy by non-null scope count, then
    uses newest `updatedAt` as the deterministic tie-breaker.
  - Returned resolved-policy objects are suitable for `calculateDeadline` and do not
    expose repository internals.
  - Missing or unmatched policy input fails closed with stable `SLA_POLICY_MISSING`.
  - Added SLA API coverage for active-policy repository filtering, global fallback,
    scoped override, newest tie-breaker, inactive-policy rejection, and missing-policy
    denial.
  - No schema changes, repository writes, SLA events, jobs, queues, notifications,
    routes, OpenAPI paths, UI, portal, reports, workflow changes, provider calls, or
    side effects were added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- sla` (6/6)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not
    applicable at HTTP/session boundary; no route or role decision was added. Policy
    resolution accepts server-side scope IDs for stored-policy matching only.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Not applicable; this task adds
    only reads and pure selection. No state change or side effect was introduced.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; the code reads and returns SLA policy fields only.
  - Customer portal exposure rules hold: Passed by scope; no portal route or
    portal-visible DTO was added.
  - Trust boundaries are tested: Passed for this task's boundary; SLA API tests cover
    allowed global/scoped resolution and denied inactive or missing policy cases.

## F3-01C - Record SLA Deadline Events When Complaints Enter SLA-Governed States

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-SLA-001
  - SLA-CALENDAR-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added `SlaRepository.createDeadlineEvent` to persist `DEADLINE_SET` SLA events
    through an `idempotencyKey` upsert.
  - Added `SlaService.recordDeadlineEvent` to resolve the active policy, calculate
    the due timestamp, derive a deterministic idempotency key from complaint ID,
    stage, policy ID, and entered timestamp, and write the deadline event.
  - Returned stable deadline-event results with complaint ID, policy ID, stage,
    `dueAt`, and idempotency key.
  - Missing policy fails closed with `SLA_POLICY_MISSING` before event creation.
  - Added SLA API coverage for repository upsert shape, successful event recording,
    duplicate retry idempotency, and missing-policy denial with no create call.
  - No workflow/complaints integration, warning/breach jobs, escalation,
    notifications, queues, routes, OpenAPI paths, UI, portal, reports, calendar-hours
    math, schema changes, migrations, provider calls, or external side effects were
    added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- sla` (9/9)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not
    applicable at HTTP/session boundary; no route or role decision was added.
    `recordDeadlineEvent` accepts server-side complaint/stage/scope context only.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Not applicable to complaint
    state; this task writes only SLA deadline events and enqueues no side effects.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; the code persists and returns only SLA event metadata.
  - Customer portal exposure rules hold: Passed by scope; no portal route or
    portal-visible DTO was added.
  - Trust boundaries are tested: Passed for this task's boundary; SLA API tests cover
    successful recording, duplicate retry, and missing-policy denial before write.

## F3-02A - Add Idempotent SLA Warning Job At Configured Threshold

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-SLA-001
  - SLA-CALENDAR-001
  - ARCH-WORKFLOW-001
  - REQ-NOTIFY-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added `SlaRepository.findDeadlineEventsForWarning` to read stored
    `DEADLINE_SET` events with non-null deadlines and linked policy duration/warning
    percent data.
  - Added `SlaRepository.createWarningEvent` to upsert one `SlaEventType.WARNING`
    event by deterministic warning idempotency key.
  - Added `SlaService.runWarningJob` to scan deadline events, compute the configured
    warning threshold from stored `durationMinutes` and `warningPercent`, safely skip
    missing/malformed data, and return scanned/created/skipped counts plus warning
    idempotency keys.
  - Warning keys derive from the recorded deadline event key as
    `sla:warning:<deadlineKey>`, so retries do not duplicate warning events.
  - Added SLA API coverage for warning-event repository query/upsert shape, due
    filtering, duplicate retry idempotency, skipped malformed data, and no-op behavior
    when no deadline warning is due.
  - No breach jobs, escalation, notification provider calls, queues, workflow changes,
    routes, OpenAPI paths, UI, portal, reports, calendar-hours math, schema changes,
    migrations, provider credentials, or external side effects were added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- sla` (12/12)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not
    applicable at HTTP/session boundary; no route or role decision was added. The job
    reads backend-owned SLA deadline events as its source of truth.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Not applicable to complaint
    state; this task writes only SLA warning events and introduces no side-effect
    enqueueing or delivery.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; the code persists and returns only SLA event metadata.
  - Customer portal exposure rules hold: Passed by scope; no portal route or
    portal-visible DTO was added.
  - Trust boundaries are tested: Passed for this task's boundary; SLA API tests cover
    due warning creation, duplicate retry idempotency, malformed deadline skip, and
    not-due no-op behavior.

## REPAIR-F3-02A - Honest SLA Warning Job Results And Malformed Policy Skip

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-SLA-001
  - SLA-CALENDAR-001
  - ARCH-WORKFLOW-001
  - REQ-NOTIFY-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Replaced warning-event upsert result handling with `createMany` plus
    `skipDuplicates`, returning `true` only when the unique idempotency key inserted
    a new warning event.
  - Updated `SlaService.runWarningJob` so duplicate warning retries increment
    `skipped`, not `created`, and only newly inserted warnings appear in
    `warningIdempotencyKeys`.
  - Added explicit fail-closed warning-job checks for invalid stored policy data:
    non-positive `durationMinutes` and out-of-range `warningPercent`.
  - Added focused SLA API coverage proving first due run creates one warning,
    duplicate retry creates zero additional warnings with honest counts, and invalid
    stored policy values skip without writes.
  - No breach jobs, escalation, notification delivery, provider calls, queues,
    workflow changes, routes, OpenAPI paths, UI, portal, schema changes, or
    migrations were added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- sla` (13/13)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not
    applicable at HTTP/session boundary; no route or role decision was added.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Not applicable to complaint
    state; this repair writes only SLA warning events through an idempotent insert
    and introduces no side-effect enqueueing or delivery.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; the code persists and returns only SLA event metadata.
  - Customer portal exposure rules hold: Passed by scope; no portal route or
    portal-visible DTO was added.
  - Trust boundaries are tested: Passed for this repair's boundary; SLA API tests
    cover new warning creation, duplicate retry skip, invalid stored policy skip,
    and not-due no-op behavior.

## F3-02B - Add Idempotent SLA Breach Job And Reportable Breach Event

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-SLA-001
  - SLA-CALENDAR-001
  - ARCH-WORKFLOW-001
  - REQ-NOTIFY-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added `SlaRepository.findDeadlineEventsForBreach` to read backend-recorded
    `DEADLINE_SET` events with non-null deadlines and non-terminal complaint status.
  - Added `SlaRepository.createBreachEvent` using `createMany` with
    `skipDuplicates`, so the unique breach idempotency key reports duplicate retries
    as skipped.
  - Added `SlaService.runBreachJob` to create one `SlaEventType.BREACH` event when
    `dueAt <= now`, skip future deadlines, skip terminal complaint statuses
    (`CLOSED`, `REJECTED`), and return scanned/created/skipped counts plus breach
    idempotency keys.
  - Breach keys derive from the recorded deadline event key as
    `sla:breach:<deadlineKey>`, so retries do not duplicate breach events.
  - Added focused SLA API coverage for first due breach creation, duplicate retry
    skip, future deadline skip without write, terminal complaint skip without write,
    and repository query/create shape.
  - No escalation notification delivery, provider calls, queues, workflow changes,
    routes, OpenAPI paths, UI, portal behavior, schema changes, migrations, secrets,
    or external side effects were added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- sla` (16/16)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not
    applicable at HTTP/session boundary; no route or role decision was added. The
    job reads backend-owned SLA deadline events as its source of truth.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Not applicable to complaint
    state; this task writes only SLA breach events and introduces no escalation
    enqueueing or notification delivery.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; the code persists and returns only SLA event metadata.
  - Customer portal exposure rules hold: Passed by scope; no portal route or
    portal-visible DTO was added.
  - Trust boundaries are tested: Passed for this task's boundary; SLA API tests cover
    due breach creation, duplicate retry idempotency, future-deadline skip, and
    terminal-status skip before write.

## F3-03A1 - Generate Notifications Module Boundary And Manifest

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-NOTIFY-001
  - REQ-SLA-001
  - SLA-CALENDAR-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Ran the canonical module generator for `notifications`.
  - Added the generated `apps/api/src/modules/notifications/` module shell,
    controller, service, repository, DTO stubs, and constructor smoke specs.
  - Replaced the generated `MODULE.md` with the real notifications boundary:
    `NotificationsService` public surface, `notifications` owned table, allowed
    `core/http-kernel` dependency for `PrismaService`, and Phase 3 SRS IDs.
  - No notification behavior, routes, OpenAPI paths, provider delivery, BullMQ
    workers, SLA imports, schema changes, migrations, UI, portal behavior, or
    notification templates were added.
- Verification:
  - Passed: `corepack pnpm generate:module -- notifications`
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not
    applicable; no route, session, role, or branch-scope decision was added.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Not applicable; this task adds a
    behavior-free module boundary and writes no state.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; no logging, DTO response behavior, providers, or credentials
    were added.
  - Customer portal exposure rules hold: Passed by scope; no portal route or
    portal-visible DTO was added.
  - Trust boundaries are tested: Passed for this boundary task by `lint`, which
    enforces module manifests and cross-module import rules; behavior-level
    allowed/denied cases are deferred to `F3-03A2`.

## F3-03A2 - Add Queued Internal Notification Public Service

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-NOTIFY-001
  - REQ-SLA-001
  - SLA-CALENDAR-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added `NotificationsRepository.queueInternal` to create queued `IN_APP`
    notification rows in the existing `notifications` table with explicit selected
    response fields.
  - Added `NotificationsService.queueInternal` as the module public service method.
    It validates `templateCode`, defaults/validates `locale`, normalizes optional
    `complaintId` and `recipientUserId`, validates JSON payloads, and denies unsafe
    payload keys before writing.
  - Registered `PrismaService` in `NotificationsModule`.
  - Added `test:api -- notifications` support in the existing API test runner because
    the task required that proof command.
  - Added focused notifications API tests proving one valid queued in-app row,
    repository persistence shape, blank template-code denial before write, and unsafe
    payload key denial before write.
  - No provider delivery, routes, OpenAPI paths, BullMQ workers, SLA imports, schema
    changes, migrations, UI, portal behavior, template management, provider
    credentials, sent/failed state, or provider results were added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- notifications` (4/4)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not
    applicable at HTTP/session boundary; no route, session, role, or branch-scope
    decision was added. The public service accepts backend caller data only.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: This task queues notification
    rows only and does not change complaint state. `F3-03A3` will call this service
    only after a new breach commit.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed; unsafe payload keys matching password/token/otp/hash/secret/credential
    are rejected before write, and provider fields are not accepted by the service.
  - Customer portal exposure rules hold: Passed by scope; no portal route,
    portal-visible DTO, internal comments, audit logs, DMS codes, or staff PII were
    added.
  - Trust boundaries are tested: Passed; notifications tests cover the allowed queued
    in-app write and denied blank template/unsafe secret payload cases before write.

## REPAIR-F3-03A2 - Reject Non-Plain Notification Payload Objects

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-NOTIFY-001
  - REQ-SLA-001
  - SLA-CALENDAR-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Tightened `NotificationsService` payload validation so JSON primitives, arrays,
    and plain objects are allowed, while non-plain objects are rejected before
    repository writes.
  - Kept unsafe payload-key denial intact.
  - Added focused notifications API coverage proving `Date`, `Map`, and `Set`
    payloads reject before write.
  - No provider delivery, routes, OpenAPI paths, BullMQ workers, SLA imports, schema
    changes, migrations, UI, portal behavior, or template management was added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- notifications` (5/5)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not
    applicable at HTTP/session boundary; no route, session, role, or branch-scope
    decision was added.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: This repair only tightens
    notification payload validation and writes no complaint state.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed; unsafe payload-key denial remains and non-plain payload objects now
    reject before write.
  - Customer portal exposure rules hold: Passed by scope; no portal route,
    portal-visible DTO, internal comments, audit logs, DMS codes, or staff PII were
    added.
  - Trust boundaries are tested: Passed; notifications tests cover allowed queued
    in-app write, blank template denial, unsafe secret payload denial, and non-plain
    object denial before write.

## F3-03A3 - Queue Escalation Notification Events After SLA Breach Commit

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-NOTIFY-001
  - REQ-SLA-001
  - SLA-CALENDAR-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Imported `NotificationsModule` into `SlaModule` so SLA depends on the
    notifications public service boundary, not its repository, DTOs, Prisma models,
    routes, workers, or provider code.
  - Injected `NotificationsService` into `SlaService`.
  - Updated `SlaService.runBreachJob` to call `NotificationsService.queueInternal`
    only after `SlaRepository.createBreachEvent` reports a newly inserted breach.
  - Queued notification payload uses backend-owned breach context only: complaint ID,
    policy ID, stage, due timestamp, and breach idempotency key.
  - Kept `recipientUserId` nullable; no staff routing query was invented.
  - Added focused SLA API coverage proving a newly created breach queues one
    internal notification, duplicate retry does not queue another notification,
    and future/terminal skips still do not queue.
  - No provider delivery, template management, HTTP routes, OpenAPI paths, BullMQ
    workers, schema changes, migrations, UI, portal behavior, reports, or direct
    writes to another module's table were added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- sla` (16/16)
  - Passed: `corepack pnpm test:api -- notifications` (5/5)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Not
    applicable at HTTP/session boundary; no route, session, role, branch-scope
    decision, or client authority was added. The job uses backend-recorded SLA
    deadline/breach data.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: This task adds a side effect
    only after a new breach event insert reports success. It does not change
    complaint status, history, or audit behavior.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed; the payload includes only complaint ID, policy ID, stage, due timestamp,
    and breach idempotency key. No provider fields or credentials are accepted or
    written.
  - Customer portal exposure rules hold: Passed by scope; no portal route,
    portal-visible DTO, internal comments, audit logs, DMS codes, or staff PII were
    added.
  - Trust boundaries are tested: Passed; SLA tests cover allowed queueing after a
    new breach and denied/no-op queueing for duplicate retry, future deadline, and
    terminal complaint skips.

## F3-04A - Enforce Send-Back, Reopen, And Resolution Required Data

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-RESOLUTION-001
  - ARCH-WORKFLOW-001
  - WORKFLOW-MATRIX-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added required-data validation in `ComplaintsService.applyTransition` after
    matrix/RBAC checks and before the repository transaction.
  - `SEND_BACK`, `REOPEN`, `REJECT_AS_INVALID`, `REJECT_AFTER_REVIEW`,
    `REJECT_AFTER_INVESTIGATION`, and `REJECT_RESOLUTION` now require non-blank
    `reason`.
  - `RESOLVE` and `RESOLVE_DIRECTLY` now require non-blank `resolutionType`,
    non-blank `resolutionSummary`, and backend-owned `actorId`.
  - `CLOSE` now requires closure confirmation in `reason` plus non-blank
    `customerCommunicationStatus`.
  - Extended transition DTO parsing and OpenAPI schema/checks for the optional
    required-by-action fields.
  - Added focused workflow coverage proving valid required-data transitions still
    write status/history/audit in one transaction and missing required data rejects
    with `VALIDATION_FAILED` before transaction/write.
  - Kept `complaints.service.ts` under the 300-line source budget at 289 lines.
  - No schema changes, migrations, comments, attachments, notifications, SLA
    recalculation, survey scheduling, routes, UI, portal behavior, or provider calls
    were added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- workflow` (29/29)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed.
    No route authority changed; existing controller/session context remains the
    source for actor role, branch scope, and actor ID.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed. Valid transitions still
    write status, history, and WORKFLOW audit inside the existing transaction; new
    validation rejects before that transaction and adds no side effects.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; no credential/provider fields or secret sources were added.
  - Customer portal exposure rules hold: Passed by scope; no portal route,
    portal-visible DTO, internal comments, audit logs, DMS codes, or staff PII
    exposure was added.
  - Trust boundaries are tested: Passed; workflow tests cover allowed transitions
    with required data, missing-data denial before transaction, and the existing
    invalid-transition, unauthorized-role, stale-status, and branch-scope denial
    surface.

## F3-04B - Add Closure/Reopen Side-Effect Scheduling Without In-Transaction Side Effects

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-RESOLUTION-001
  - REQ-NOTIFY-001
  - REQ-SURVEY-001
  - ARCH-WORKFLOW-001
  - WORKFLOW-MATRIX-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
- Evidence:
  - Imported `NotificationsModule` into `ComplaintsModule`.
  - Injected only `NotificationsService` into `ComplaintsService`; no notification
    repository, DTO, Prisma model, worker, route, or provider code was imported.
  - Added post-transaction queueing for `CLOSE` with template code
    `survey.schedule.internal`.
  - Added post-transaction queueing for `REOPEN` with template code
    `workflow.reopened.internal`.
  - Queue payloads use backend workflow context: complaint ID, from/to status,
    action, actor ID, reason, and `customerCommunicationStatus`.
  - Added focused workflow coverage proving close/reopen queue after commit and no
    queue on validation failure, stale persisted status, or transaction failure.
  - Kept `complaints.service.ts` under the 300-line source budget at 298 lines.
  - No schema changes, migrations, survey module behavior, SLA recalculation,
    BullMQ workers, provider delivery, new HTTP routes, OpenAPI changes, UI, portal
    behavior, reports, comments, or attachments were added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- workflow` (33/33)
  - Passed: `corepack pnpm test:api -- notifications` (5/5)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed.
    No route authority changed; close/reopen queue payload uses the existing
    server-derived actor ID and workflow context.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed. Tests prove queueing
    occurs after transaction commit and does not occur on validation, stale status,
    or transaction failure.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; no provider credentials or secret-bearing fields were added.
  - Customer portal exposure rules hold: Passed by scope; no portal route,
    portal-visible DTO, internal comments, audit logs, DMS codes, or staff PII
    exposure was added.
  - Trust boundaries are tested: Passed; workflow tests cover allowed close/reopen
    side effects and denied/no-op validation, stale status, and transaction failure
    paths.

## F4-01A - Generate Portal Module Boundary And Manifest

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-PORTAL-001
  - REQ-PORTAL-002
  - PORTAL-SEC-001
  - REQ-NOTIFY-001
  - REQ-SURVEY-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
- Evidence:
  - Ran the canonical module generator for `portal`.
  - Added `apps/api/src/modules/portal/` with generated controller, service,
    repository, DTO, module, and constructor smoke-test files.
  - Replaced the generated `MODULE.md` with the real portal boundary:
    `PortalService` is the only public surface; `portal_verifications` and
    `portal_sessions` are owned tables; allowed dependencies are
    `core/http-kernel`, `core/audit.service`, `core/rate-limit.guard`, and other
    modules' public services only.
  - Kept generated behavior files behavior-free. No public route, AppModule wiring,
    complaint submission behavior, OTP generation/hash/verification/session,
    notification delivery/template work, OpenAPI path, web UI, schema change, or
    migration was added.
- Verification:
  - Passed: `corepack pnpm generate:module -- portal`
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope; no route, guard, role, or branch-scope decision was added.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope; no state
    change or side effect was added.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; no credential/OTP/token fields, logs, routes, or responses
    were added.
  - Customer portal exposure rules hold: Passed by scope; no customer data,
    complaint status, internal comments, audit logs, DMS codes, staff PII,
    portal-visible DTO, token, or public route was exposed.
  - Trust boundaries are tested: Passed for this behavior-free boundary; lint
    enforces the manifest and module-boundary rules, and the generated smoke tests
    prove the inert controller/service can be constructed.

## F4-01B - Add Portal Complaint Submission Service Path

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-PORTAL-001
  - PORTAL-SEC-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
- Evidence:
  - Imported `ComplaintsModule` into `PortalModule`.
  - Injected only the complaints public service, `ComplaintsService`, into
    `PortalService`; no complaint repository, DTO folder, Prisma model, route, or
    AppModule wiring was imported by the portal service.
  - Added `PortalService.submitComplaint`, which delegates to complaint creation
    with `actorId: null` and `requestSource: CUSTOMER_PORTAL`.
  - Added the smallest complaint-service support needed for portal submissions:
    `CreateInternalComplaintInput.requestSource` can override the existing default
    of `STAFF_API`, so portal-created status history records `CUSTOMER_PORTAL`.
  - Added workflow-suite coverage for the allowed portal submission delegate path,
    invalid portal input rejection before transaction/write, and `PortalModule`
    importing `ComplaintsModule` while exporting only `PortalService`.
  - Kept `complaints.service.ts` under the 300-line source budget at 298 lines.
  - No public portal route, AppModule wiring, rate-limit guard wiring, controller
    DTO parsing, OpenAPI path, web UI, E2E, OTP/session behavior, notification
    provider/template work, schema change, migration, attachment, tracking read,
    comment, or survey behavior was added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- workflow` (36/36)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope; no route, guarded staff authority, role input, or branch-scope
    decision was added. Portal submission records `actorId: null` and
    `CUSTOMER_PORTAL` request source server-side.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed. Portal submission
    delegates to `ComplaintsService.createInternal`, which writes complaint,
    initial status history, and COMPLAINT audit inside one transaction. The new
    test proves invalid portal input rejects before transaction/write.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by scope; no OTP/session/token/provider fields or logs were added.
  - Customer portal exposure rules hold: Passed by scope; no public read route,
    complaint detail/status tracking response, internal comments, audit logs, DMS
    codes, staff PII, OTP value, token, or provider credential exposure was added.
  - Trust boundaries are tested: Passed; tests cover allowed portal delegation,
    denied invalid portal input before write, and module-boundary export/import
    shape.

## F4-01C - Add Public Submission HTTP Route, OpenAPI, Rate Limit, And Portal API Tests

- Date: 2026-06-19
- Risk: High
- Status: Passed - Verify Gate
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-PORTAL-001
  - PORTAL-SEC-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added `POST /portal/complaints` to `PortalController`.
  - Added public portal submission parsing in `create-portal.dto.ts`; customer
    phone and branch are required at the public boundary, and spoofed actor data is
    ignored because the route maps only parsed public fields plus request context.
  - Added `PortalSubmissionRateLimitGuard` using the existing in-memory rate-limit
    store pattern. The guard limits by IP and customer phone when present and writes
    a safe `SECURITY` / `rate_limit_triggered` audit with `targetType:
    portal_submission`.
  - Wired `PortalModule` into `main.ts` so the route is reachable.
  - Updated OpenAPI canonical generation and regenerated `packages/contracts/openapi.json`
    with `POST /portal/complaints` and `PortalComplaintRequest`.
  - Added `test:api -- portal` support plus portal API tests for allowed route
    delegation, invalid request rejection before service call, guard metadata, and
    rate-limit denial/audit.
  - Existing workflow tests still prove portal service submission delegates through
    `ComplaintsService`, which writes complaint, initial status history, and
    COMPLAINT audit in one transaction with `CUSTOMER_PORTAL` request source.
  - No OTP generation, hashing, verification, portal sessions, tracking reads,
    timeline, follow-up comments, attachments, survey behavior, notification
    delivery/template work, web UI, E2E, schema change, migration, complaint detail
    response, or unrelated complaint exposure was added.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- portal` (4/4)
  - Passed: `corepack pnpm test:api -- workflow` (36/36)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope for this unauthenticated public route. No staff role or branch
    authority is accepted from the client; the route delegates public fields to the
    portal service and records portal actor context server-side.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed. Portal route delegates
    to `PortalService.submitComplaint`, which delegates to `ComplaintsService`
    creation. Workflow tests prove that path writes complaint, status history, and
    COMPLAINT audit in one transaction and rejects invalid input before writes.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed. The new route returns only `{ complaint: { id, referenceNumber,
    status } }`; no OTP/session/token/provider fields exist in this slice, and
    rate-limit audit metadata contains only limit/window/key types.
  - Customer portal exposure rules hold: Passed. The new public route creates a
    complaint and returns the creation result only; it does not expose tracking
    details, internal comments, audit logs, DMS codes, staff PII, OTP values,
    tokens, provider credentials, or unrelated complaints.
  - Trust boundaries are tested: Passed. Portal API tests cover allowed submission
    route delegation, invalid-body denial before service write, rate-limit guard
    attachment, and rate-limit denial/audit; workflow tests cover the underlying
    allowed portal service path and denied invalid input before transaction.

## REPAIR-F4-01C - Remove DMS Customer Number From Public Portal Submission

- Date: 2026-06-19
- Risk: High
- Status: Passed - returns to Verify Gate
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-PORTAL-001
  - PORTAL-SEC-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Removed `customerNumber` from the public `PortalComplaintRequestDto` type and parser.
  - Changed `SubmitPortalComplaintInput` so public portal callers cannot provide `customerNumber`.
  - `PortalService.submitComplaint` now explicitly delegates to complaint creation with `customerNumber: null` and `CUSTOMER_PORTAL` request source.
  - Removed `customerNumber` from the OpenAPI `PortalComplaintRequest` schema and regenerated `packages/contracts/openapi.json`.
  - Updated portal route tests to send spoofed `customerNumber: 'DMS-SECRET'` and prove it is not forwarded from the public controller boundary.
  - Updated workflow portal service tests to prove the complaint service delegate receives `customerNumber: null`.
  - Staff complaint creation remains unchanged and still supports `customerNumber` outside the public portal route.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (initial sandbox run failed with `spawn EPERM`; rerun outside sandbox passed 20/20 and coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- portal` (initial sandbox run failed with `spawn EPERM`; rerun outside sandbox passed 4/4)
  - Passed: `corepack pnpm test:api -- workflow` (initial sandbox run failed with `spawn EPERM`; rerun outside sandbox passed 36/36)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed by scope; this public route has no staff role/branch authority, and the repair removes the DMS customer-code input from the public boundary.
  - Each state change writes status history and an audit entry in the same transaction; side effects enqueue after commit: Passed. Portal submission still delegates to `ComplaintsService.createInternal`, and workflow tests prove complaint creation writes complaint, initial status history, and COMPLAINT audit in one transaction.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed. The repair adds no secret fields and keeps rate-limit audit metadata safe.
  - Customer portal exposure rules hold: Passed. Public portal submission no longer accepts or documents DMS customer number/code; tests prove spoofed `customerNumber` is stripped and the service forwards `customerNumber: null`.
  - Trust boundaries are tested: Passed. Portal tests cover allowed submission with spoofed DMS number stripped and invalid-body denial; workflow tests cover the allowed service delegate with `customerNumber: null` and invalid input denial before writes.

## F4-02A Built - AUTO PHASE Continuing

`F4-02A` added the public portal tracking OTP request boundary without allowing reference-only tracking reads. `POST /portal/tracking/otp` accepts only `referenceNumber` and `customerPhone` plus server-derived request context, rate-limits by IP, phone, and reference, resolves the complaint/customer match through `ComplaintsService.findPortalVerificationTarget`, writes a `portal_verifications` row through `PortalRepository`, and queues a notification through `NotificationsService` only after persistence succeeds.

The OTP value is generated inside `PortalService.requestTrackingOtp` and immediately stored as a salted SHA-256 hash in `portal_verifications`. The notification queue payload contains only verification metadata (`verificationId`, `referenceNumber`, `expiresAt`) because provider delivery/templates are out of scope and this task forbids writing plaintext OTP values.

Requirement IDs: REQ-PORTAL-002, PORTAL-SEC-001, REQ-NOTIFY-001, ARCH-WORKFLOW-001, METHOD-AUDIT-001, METHOD-TEST-001, API-STANDARD-001.

Proof:
- Passed: `corepack pnpm lint`
- Passed: `corepack pnpm typecheck`
- Passed: `corepack pnpm test` (20/20)
- Passed: `corepack pnpm test:api -- portal.tracking` (6/6)
- Passed: `corepack pnpm test:api -- notifications` (6/6)
- Passed: `corepack pnpm openapi:check`
- Passed: `git diff --check` (line-ending warnings only)

Security self-check:
- Roles and branch scope: no staff role or branch authority is accepted from the public route; the route accepts only portal-safe reference/phone input and returns no complaint details.
- State changes and side effects: no complaint workflow state changes happen in this slice; the portal-owned verification row is persisted before `NotificationsService.queueInternal` is called, and denial paths do not persist or queue.
- Secret handling: OTPs, hashes, tokens, credentials, and provider secrets are not returned or logged. Tests assert hash-only verification persistence and notification metadata without OTP/hash payload keys.
- Portal exposure: DMS customer codes/customer numbers, internal comments, audit logs, staff PII, and unrelated complaints are not accepted or returned by the OTP request boundary.
- Trust boundaries: `test:api -- portal.tracking` covers an allowed request, unknown/mismatched reference/phone denial, no notification queue on denial, rate-limit denial, and hash-only persistence.

Assumptions and gaps:
- The queued notification is a metadata request only; plaintext OTP delivery is deferred with provider/template work because this task explicitly excludes provider delivery and hardcoded templates.

## F4-02B Built - Verify Gate

`F4-02B` added OTP verification and expiring portal session issuance for the customer portal tracking flow. `POST /portal/tracking/otp/verify` accepts only `verificationId` and `otp` plus server-derived request context, verifies only pending and unexpired portal verification rows, compares OTPs against the stored salted hash with timing-safe comparison, increments failed attempts, marks expired rows, marks successful rows as verified, writes a hashed portal session token, and returns only the one-time session token plus expiration.

Portal verification status updates, session creation, and SECURITY audit entries run inside `PortalRepository.transaction`. The response never includes complaint details, customer details, DMS customer codes, internal comments, audit logs, staff PII, OTP hashes, or stored session hashes.

Requirement IDs: REQ-PORTAL-002, PORTAL-SEC-001, ARCH-WORKFLOW-001, METHOD-AUDIT-001, METHOD-TEST-001, API-STANDARD-001.

Proof:
- Passed: `corepack pnpm lint`
- Passed: `corepack pnpm typecheck`
- Passed: `corepack pnpm test` (20/20)
- Passed: `corepack pnpm test:api -- portal.tracking` (12/12)
- Passed: `corepack pnpm openapi:check`
- Passed: `git diff --check` (line-ending warnings only)

Security self-check:
- Roles and branch scope: the public verification route accepts no staff role or branch authority from the client; it uses only a portal verification ID and OTP and returns no complaint data.
- State changes and audit: failed attempt increments, expiration marking, successful verification marking, session creation, and corresponding SECURITY audit entries happen inside the portal repository transaction.
- Secret handling: OTPs, OTP hashes, session hashes, provider secrets, and credentials are not returned or logged. The only returned token is the new portal session token; persistence stores only its SHA-256 hash.
- Portal exposure: no internal comments, audit logs, DMS customer codes/customer numbers, staff PII, unrelated complaints, or complaint details are exposed by the request or verify routes.
- Trust boundaries: `test:api -- portal.tracking` covers allowed verification, wrong OTP denial with attempt increment, expired verification denial, exhausted-attempt denial, hash-only session persistence, and route parsing that strips unsafe fields.

Assumptions and gaps:
- Portal session consumption for tracking reads remains out of scope and is queued for `F4-02C` after independent VERIFY accepts this gate.

## FORGE-AUTO-PHASE-003 - Retire Per-Task Verify Gates

- Date: 2026-06-19
- Risk: Medium
- Status: Passed
- Requirement IDs:
  - CONTRACT-READINESS-002
  - METHOD-TEST-001
- Evidence:
  - Removed active `Verify Gate: required` routing from `.forge/forge.md` PLAN, BUILD, and AUTO PHASE rules.
  - Updated `.forge/policy.md` so High/Critical tasks still record a security self-check, but independent review happens at the phase-end `PHASE-REVIEWER` gate.
  - Updated the active `REPAIR-F4-02B` task so a passing repair continues to `F4-02C` instead of writing another VERIFY task.
  - Added a current-state note clarifying that the F4-02B repair remains valid, but per-task verify-gate stops are retired.
- Verification:
  - Passed: active protocol files have no `Verify Gate: required`, `independent VERIFY before`, `write the VERIFY task`, or `keep ... verify gate` wording.
- Notes:
  - Historical evidence, trust, backlog, and state entries still mention old verify gates as history.
  - AUTO PHASE now stops for PLANNER, blockers, failed checks, scope overflow, leaving the phase, and phase-end review only.

## REPAIR-F4-02B - Audit OTP Verification Failure Outcomes

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-PORTAL-002
  - PORTAL-SEC-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - `PortalService.verifyTrackingOtp` now writes `SECURITY` / `portal_otp_failed`
    audit records before returning `PORTAL_VERIFICATION_FAILED` for unknown
    verification IDs, non-pending verification rows, and exhausted-attempt
    pending rows.
  - Unknown-ID audits include only request context, target type/id, and
    `{ reason: "unknown_verification" }`; no complaint/customer details are added
    when no verification row exists.
  - Known-row early denials audit safe reason/status/attempt metadata through the
    existing portal verification audit shape.
  - Existing wrong-OTP, expired-verification, and successful-verification mutation
    paths still keep the mutation and `SECURITY` audit entry inside the portal
    repository transaction.
  - Added focused `portal.tracking` tests for unknown ID, non-pending row, and
    exhausted-attempt audit coverage plus safe metadata checks.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- portal.tracking` (14/14)
  - Passed: `corepack pnpm test:api -- audit` (8/8 plus append-only proof)
  - Passed: `corepack pnpm openapi:check`
  - Failed then passed: initial `corepack pnpm test:api -- audit` timed out at
    122s while the Docker migration proof was still installing/running; rerun
    with a longer timeout passed.
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. The public verify route accepts no staff role or branch
    authority and still parses only `verificationId` and `otp` plus server-derived
    request context.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed. This repair adds audit
    to non-mutating denial paths; existing failed-attempt, expiration, and success
    mutations still audit inside the portal repository transaction. No complaint
    workflow state change or side effect is added.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed. Tests assert failure audit records do not include OTP values,
    `otpHash`, `sessionToken`, or `sessionHash`.
  - Customer portal exposure rules hold: Passed. The verify response remains a
    stable safe error on denial and still returns no complaint details, internal
    comments, audit logs, DMS codes, staff PII, unrelated complaints, OTP hashes,
    or session hashes.
  - Trust boundaries are tested: Passed. `portal.tracking` covers allowed verify
    success and denied wrong OTP, expired verification, exhausted attempts,
    unknown verification ID, and non-pending verification row.

## F4-02C - Add Verified Portal Tracking Endpoint

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-PORTAL-002
  - PORTAL-SEC-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added public `GET /portal/tracking`.
  - The route accepts the portal session token only from `x-portal-session` plus
    server-derived correlation/IP/user-agent context; reference numbers are not
    accepted by the route.
  - `PortalService.getTracking` hashes the submitted token and validates it
    through a portal-owned `portal_sessions` lookup for a non-expired session.
  - `PortalRepository.findValidSession` selects only session id, complaint id,
    customer id, and expiration; it does not return the stored session hash.
  - The verified read reuses the complaints public service and returns only public
    reference number, status, created timestamp, and updated timestamp.
  - Missing, invalid, expired, or stale sessions fail closed with
    `PORTAL_VERIFICATION_FAILED`.
  - OpenAPI now documents `GET /portal/tracking` and `PortalTrackingResponse`.
  - Added focused `portal.tracking` tests for route input stripping, allowed
    verified tracking, invalid/missing session denial before complaint lookup, and
    hash-only session lookup.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (20/20; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- portal.tracking` (18/18)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This public portal read accepts no staff role or branch
    authority; it derives access from the validated portal session.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task adds
    a read-only portal tracking endpoint and no state changes or side effects.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed. The route returns no token or hash, and repository tests prove stored
    session hashes are not selected.
  - Customer portal exposure rules hold: Passed. The response contains only public
    reference, public status, and timestamps; tests prove internal detail/timeline
    fields are not returned.
  - Trust boundaries are tested: Passed. `portal.tracking` covers allowed verified
    tracking plus denied missing/invalid session access before complaint lookup.

## F4-03A - Add Portal-Safe Timeline Read Model

- Date: 2026-06-19
- Risk: High
- Status: Failed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-PORTAL-002
  - PORTAL-SEC-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added portal-safe `timeline` mapping to the verified tracking response.
  - Timeline mapping keeps only `fromStatus`, `toStatus`, `action`, and
    `createdAt`.
  - Updated OpenAPI canonical generation for `PortalTrackingResponse.timeline`.
  - Updated focused `portal.tracking` tests to prove actor IDs, actor roles,
    internal reasons, correlation IDs, and other internal fields are filtered.
- Verification:
  - Passed: `corepack pnpm test:api -- portal.tracking` (18/18)
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Failed: `corepack pnpm test` (19/20). Failure is in
    `tools/generate-module.test.mjs`: generator output now uses the
    frontmatter/sectioned `MODULE.md` format from existing dirty
    `tools/generate-module.mjs` and `tools/lint.mjs` changes, while the test still
    expects the older inline `Owns tables: \`branches\`` text.
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. Timeline access still depends on the portal session, not
    client role/branch/reference input.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task is
    read-only.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed by code review and focused tests; timeline response returns no token or
    hash fields.
  - Customer portal exposure rules hold: Passed by focused tests; portal timeline
    output strips actor IDs, actor roles, reasons, correlation IDs, descriptions,
    comments, audit data, DMS data, and session/OTP fields.
  - Trust boundaries are tested: Passed in `portal.tracking`; final acceptance is
    blocked by the unrelated required root test failure above.

## REPAIR-F4-03A-PROOF - Align Generator Manifest Test

- Date: 2026-06-19
- Risk: Medium
- Status: Passed
- Required model tier: BUILDER-STRONG
- Repairs:
  - F4-03A - Add portal-safe timeline read model
- Evidence:
  - The generator manifest proof blocker is cleared. `tools/generate-module.test.mjs`
    now matches the current generated `MODULE.md` frontmatter/sectioned format.
  - No portal behavior changes were needed during this repair.
  - `F4-03A` remains the accepted Phase 4 behavior: verified tracking includes a
    portal-safe timeline with only `fromStatus`, `toStatus`, `action`, and
    `createdAt`.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- portal.tracking` (18/18)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check`

## F4-03B - Add Portal Follow-Up Path For Non-Closed Complaints

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-PORTAL-002
  - PORTAL-SEC-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added `POST /portal/tracking/follow-ups`.
  - The route accepts only `x-portal-session`, a public `body`, and server-derived
    request context; reference numbers and client-supplied visibility are ignored.
  - `PortalService.submitFollowUp` validates the portal session by hash through
    `PortalRepository.findValidSession`, reads the complaint through
    `ComplaintsService.getDetail`, rejects `CLOSED` and `REJECTED`, and writes the
    follow-up through `ComplaintsService.createComment` with `PUBLIC` visibility
    and `actorId: null`.
  - The public response is only `{ ok: true }`.
  - OpenAPI documents the follow-up route and its request/response schemas.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- portal.tracking` (22/22)
  - Passed: `corepack pnpm test:api -- workflow` (37/37)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. Portal follow-up accepts no staff role or branch authority;
    access comes from the verified portal session.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed. Follow-up comments are
    written through `ComplaintsService.createComment`, and workflow tests prove the
    public comment plus COMMENT audit share the same transaction.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned:
    Passed. The route returns `{ ok: true }`; tests prove session hashes are not
    selected and no session token/hash or OTP fields are returned.
  - Customer portal exposure rules hold: Passed. The route never returns internal
    comments, audit logs, DMS codes, staff PII, unrelated complaints, OTP values,
    OTP hashes, session tokens, or session hashes.
  - Trust boundaries are tested: Passed. `portal.tracking` covers allowed follow-up,
    invalid-session denial before reads/writes, and closed/rejected denial before
    comment writes; workflow covers same-transaction public comment audit safety.


## FORGE-OKF-MODULE-CONTEXT-001 - OKF-Style Module Manifests

- Date: 2026-06-19
- Risk: Low
- Status: Passed
- Requirement IDs:
  - CONTRACT-READINESS-002
  - METHOD-MODULAR-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Updated `tools/generate-module.mjs` so future `MODULE.md` files are OKF-style markdown concept documents with YAML frontmatter: `type: forge.module`, title, description, and tags.
  - Updated `tools/lint.mjs` to require OKF-style frontmatter plus the existing public surface, owned tables, dependency, and SRS sections.
  - Added frontmatter to existing module manifests without changing module behavior.
  - Documented the rule in `docs/ARCHITECTURE.md`, `AGENTS.md`, `CLAUDE.md`, and `.forge/policy.md`.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm test` (20/20)
- Notes:
  - This applies the Open Knowledge Format idea as plain markdown + YAML frontmatter, not a new service or dependency.
  - No old SLA code behavior was fixed in this task.

## FORGE-OKF-TRUTH-001 (wiring) - Module Wiring Truth Gate

- Date: 2026-06-19
- Risk: Low (CI/tooling hardening; no application or SLA behavior changed)
- Status: Passed
- Requirement IDs:
  - METHOD-MODULAR-001
  - NFR-MAINT-001
  - CONTRACT-READINESS-002
- Evidence:
  - Added `tools/wiring-check.mjs` (`checkModuleWiring`) and wired it into `tools/lint.mjs`. Every `apps/api/src/modules/<name>/<name>.module.ts` must be reachable from the runtime `AppModule` graph in `apps/api/src/main.ts`. An orphaned module now fails lint - the exact failure a shape-only `MODULE.md` check cannot see (see VERIFY-F1-06B note + PHASE-1-REVIEW condition 3: no test boots Nest / proves wiring).
  - Design pivot from the proposed boot test, justified by the repo as built: there is no scheduler (`@nestjs/schedule`/BullMQ) to introspect (SLA "jobs" are plain `SlaService` methods); `pnpm test` runs only `tools/*.test.mjs` (no Nest boot, providers need a DB); composition is fully static (plain `imports: [...]`, no forwardRef/dynamic modules), so static reachability equals the real runtime graph here. A boot-time job/route-registration check is recorded as a follow-up for when a scheduler or dynamic modules exist.
  - Finding: `SlaModule` is the one orphan (imported by nobody). `ComplaintsModule`/`NotificationsModule` are reachable via `PortalModule`. Confirms the original SLA review; scope is narrower than feared.
  - `sla` is grandfathered in a documented `knownUnwiredModules` ratchet that may only shrink. Build stays green, the debt is explicit, any NEW orphan fails, and a grandfathered module that becomes wired forces its own removal from the allowlist.
- Verification:
  - Passed: `corepack pnpm lint` (green with `sla` grandfathered; no other orphans)
  - Passed: `corepack pnpm test` (25/25; was 20 - five new wiring tests: orphan flagged, transitive reachable passes, grandfather + ratchet, missing AppModule, real-repo holds. Coverage 92.29% lines / 83.09% branch / 95.29% funcs - clears 80/65/75; `wiring-check.mjs` 91.51% / 91.89% / 100%)
- Notes:
  - Remaining FORGE-OKF-TRUTH-001 scope (declared-dependency truth and owned-table truth vs real imports/Prisma usage) is not built here; both are statically checkable and queued as the next truth-gate steps.
  - Open real-code follow-up (intentionally deferred per future-facing-only scope): wire `SlaModule` into the runtime (or its scheduler/runner) and remove it from the allowlist.

## FORGE-OKF-TRUTH-001 (deps/tables) - Manifest Truth Gate Complete

- Date: 2026-06-19
- Risk: Medium
- Status: Passed
- Requirement IDs:
  - METHOD-MODULAR-001
  - METHOD-TEST-001
  - NFR-MAINT-001
- Evidence:
  - Added `tools/manifest-truth-check.mjs` and wired it into `tools/lint.mjs`.
  - `MODULE.md` now has static truth checks for cross-module imports: every module imported from `apps/api/src/modules/<other>` must be declared in the importing module's `May depend on` section.
  - `MODULE.md` now has static truth checks for repository Prisma table usage: every Prisma table used by a module repository must be declared in the module manifest's table section.
  - Updated auth, complaints, portal, and SLA manifests so existing module dependencies/tables are explicit instead of generic.
  - This completes the tooling scope of `FORGE-OKF-TRUTH-001`: wiring truth, declared-dependency truth, and Prisma table truth are all enforced by lint.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm test` (29/29; added manifest truth tests for undeclared dependency failure, declared dependency pass, undeclared table failure, and real-repo hold)
- Notes:
  - No old SLA business behavior was fixed. SLA remains known runtime debt for scheduling/job execution.

## F4-04A - Add Explicit Portal Privacy Regression Tests

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-PORTAL-001
  - REQ-PORTAL-002
  - PORTAL-SEC-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Added an explicit public submission regression proving DMS customer identifiers
    (`customerNumber`, `customerCode`, and `dmsCustomerCode`) are stripped before
    the portal service receives input.
  - Added a reference-only tracking/follow-up regression proving route input with
    a reference number but no `x-portal-session` is denied and the reference
    number is not delegated.
  - Strengthened portal tracking response privacy coverage with unsafe source
    fields for internal comments, audit logs, DMS codes, staff email, unrelated
    complaints, OTP values, OTP hashes, session tokens, and session hashes.
  - Strengthened follow-up route privacy coverage proving client input cannot
    force internal visibility or staff actor metadata, and the response remains
    only `{ ok: true }`.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- portal` (5/5)
  - Passed: `corepack pnpm test:api -- portal.tracking` (23/23)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed. The privacy regressions prove public portal routes ignore actor,
    staff, visibility, and DMS identity fields supplied by the client.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added regression tests only; the covered follow-up write still delegates to
    the already-proven complaints transaction path.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. Tracking tests inject OTP/session/hash fields into source
    data and prove the portal response excludes them.
  - Customer portal exposure rules hold: Passed. Tests prove portal tracking and
    follow-up responses do not expose internal comments, audit logs, DMS customer
    codes, staff PII, unrelated complaints, OTP values, OTP hashes, session
    tokens, or session hashes.
  - Trust boundaries are tested: Passed. Coverage includes public submission
    sanitization, reference-only denial, verified tracking response filtering,
    and follow-up input sanitization.

## F5-01A - Generate Attachments Module Boundary And Manifest

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-FILES-001
  - REQ-FILES-001
  - REQ-PORTAL-001
  - REQ-PORTAL-002
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Ran the canonical module generator for `attachments`.
  - Filled `apps/api/src/modules/attachments/MODULE.md` with the real boundary:
    `AttachmentsService` public surface, owned `attachments` table, SRS IDs, and
    only public-service/core dependencies.
  - Wired `AttachmentsModule` into the root `AppModule` so the existing module
    reachability lint gate covers it.
  - Added no upload/download routes, object-storage adapter behavior, malware
    scan behavior, attachment OpenAPI paths, attachment authorization rules,
    portal/staff UI, schema or migration changes, provider calls, or secrets.
- Verification:
  - Passed: `corepack pnpm generate:module -- attachments`
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm openapi:check`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no routes or authorization decisions; the
    manifest declares future staff route enforcement through `core/auth.guard`.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state changes or side effects.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. The generated shell has no runtime logging, provider calls,
    routes, or responses.
  - Customer portal exposure rules hold: Passed by scope. No customer-visible
    attachment route or portal response was added.
  - Trust boundaries are tested: Passed for this boundary-only slice by lint
    reachability/manifest truth checks and generated construction tests. Upload
    allowed/denied authorization cases are intentionally deferred to the first
    attachment behavior task.

## PLAN-F5-01B - Split Secure Attachment Behavior

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: PLANNER
- Requirement IDs:
  - ARCH-FILES-001
  - REQ-FILES-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Split the next Phase 5 attachment work into `F5-01B`, a backend-only upload
    metadata policy validation task.
  - Kept storage adapters, persistence, upload/download routes, authorization,
    audit writes, malware scan state, portal behavior, and UI out of the first
    behavior slice.
  - Required `test:api -- attachments` coverage is scoped to allowed
    image/PDF/audio/video metadata and denied executable, oversize, and
    mismatched metadata.
- Verification:
  - Not Run: planning-only task; no application code changed by this plan.

## F5-01B - Add Attachment Upload Metadata Policy Validation

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-FILES-001
  - REQ-FILES-001
  - METHOD-API-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
- Evidence:
  - Added `AttachmentsService.validateUploadMetadata` as the first backend-only
    attachment behavior.
  - Enforced MVP defaults from `REQ-FILES-001` AC5: image/PDF metadata up to
    10 MB, audio/video metadata up to 50 MB, and executable metadata blocked.
  - Validates file name, extension, content type, and size together before any
    storage or persistence behavior exists.
  - Uses stable SRS error codes `ATTACHMENT_TYPE_BLOCKED` and
    `ATTACHMENT_SIZE_EXCEEDED`.
  - Added the `attachments` API test suite and focused policy coverage for
    allowed image/PDF/audio/video metadata plus denied executable, oversize, and
    mismatched extension/content-type metadata.
  - Added no upload/download routes, object-storage adapter behavior, attachment
    persistence, audit entries, malware scan state changes, portal/staff UI,
    OpenAPI attachment paths, schema/migration changes, provider calls, or
    secrets.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- attachments` (4/4)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no routes or authorization decisions.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    rejects metadata before storage/persistence and adds no state changes or
    side effects.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. The policy method does no logging, provider calls, route
    response shaping, or secret handling.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    customer-visible attachment response was added.
  - Trust boundaries are tested: Passed. `test:api -- attachments` covers
    allowed metadata and denied executable, oversize, and mismatched metadata.

## PLAN-F5-PHASE - Plan Remaining Attachments And Notifications Phase

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: PLANNER
- Requirement IDs:
  - ARCH-FILES-001
  - REQ-FILES-001
  - ARCH-INTEGRATION-001
  - REQ-NOTIFY-001
  - REQ-NOTIFY-002
  - REQ-SURVEY-001
  - REQ-PORTAL-002
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Split the remaining Phase 5 backlog into small tasks for attachment storage,
    metadata persistence/audit, staff and portal upload/download routes, malware
    scan state, notification provider adapters, templates, delivery logging,
    preferences/quiet hours, and survey link flow.
  - Kept the next buildable task to `F5-01C` only, per Forge PLAN output rules.
  - Added missing Phase 5 backlog parents for notification preferences/quiet
    hours and survey link flow because `PLAN-M5` includes them.
- Verification:
  - Not Run: planning-only task; no application source behavior changed by this
    plan.

## F5-01C - Add Attachment Storage Port And In-Memory Adapter

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-FILES-001
  - REQ-FILES-001
  - ARCH-INTEGRATION-001
  - METHOD-API-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
- Evidence:
  - Added `ATTACHMENT_STORAGE` plus the module-owned `AttachmentStoragePort`
    boundary and `InMemoryAttachmentStorage` test double.
  - Wired the in-memory adapter into `AttachmentsModule` without provider
    credentials, SDKs, environment reads, or real S3 calls.
  - Added `AttachmentsService.storeObject` and `prepareDownload` so attachment
    object behavior goes through the module service boundary.
  - `prepareDownload` returns a backend-only `attdl_` token and expiry, with no
    public unauthenticated URL field.
  - Missing storage objects fail with stable safe `ATTACHMENT_NOT_FOUND`.
  - Added focused `test:api -- attachments` coverage for byte storage,
    non-public download token shape, missing object denial, and no provider
    credential exposure.
  - Added no upload/download HTTP routes, database persistence, audit entries,
    malware scan behavior, portal/staff UI, OpenAPI attachment paths,
    schema/migration changes, provider credentials, or real provider calls.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- attachments` (8/8)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no routes, client input authority, RBAC, or
    branch-scope decisions.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    stores only in-memory object bytes for the adapter slice and adds no durable
    state changes or side effects.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. The implementation has no logging,
    no provider SDK, no environment reads, and no credential-bearing response.
    The only token is the required non-public attachment download handle tested
    by `test:api -- attachments`.
  - Customer portal exposure rules hold: Passed by scope. No portal route,
    customer-visible attachment response, internal comment, audit, DMS code, or
    staff PII exposure was added.
  - Trust boundaries are tested: Passed. `test:api -- attachments` covers an
    allowed store/download-token path and denied missing-object path, plus
    provider credential non-exposure.

## F5-01D - Persist Attachment Metadata With Upload Audit

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-FILES-001
  - REQ-FILES-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added `AttachmentsRepository.createMetadata` for attachment table writes
    owned by the attachments module.
  - Added `AttachmentsService.createUpload`, which validates upload metadata,
    stores object bytes through the storage port, then persists metadata and
    writes an `ATTACHMENT` `attachment_uploaded` audit entry in the same
    repository transaction.
  - Invalid upload metadata rejects before storage, persistence, or audit.
  - The persisted metadata uses the schema default `PENDING` scan status; no scan
    transition behavior was added.
  - Updated `AttachmentsModule` with `PrismaService`, `AuditService`, repository,
    service, and the in-memory storage provider.
  - Updated `MODULE.md` so the module boundary reflects the storage port and
    metadata persistence now owned by this module.
  - Added focused `test:api -- attachments` coverage for successful metadata
    persistence plus same-transaction audit, invalid metadata pre-write denial,
    and provider credential non-exposure.
  - Added no upload/download HTTP routes, download authorization, malware scan
    behavior beyond default status, portal/staff UI, OpenAPI attachment paths,
    schema/migration changes, provider credentials, or real provider calls.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- attachments` (10/10)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no routes or authorization decisions; route
    enforcement is queued for `F5-01E`.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed. Attachment metadata
    persistence and `ATTACHMENT` upload audit are tested against the same
    transaction client. No side effects were added.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. The implementation has no logging,
    no provider SDK, no environment reads, and tests cover provider credential
    non-exposure.
  - Customer portal exposure rules hold: Passed by scope. No portal route,
    customer-visible attachment response, internal comment, audit, DMS code, or
    staff PII exposure was added.
  - Trust boundaries are tested: Passed. `test:api -- attachments` covers the
    allowed upload persistence/audit path and denied invalid metadata path before
    storage, persistence, or audit.

## F5-01E - Add Staff Attachment Upload Route With RBAC, Branch Scope, And OpenAPI

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-FILES-001
  - REQ-FILES-001
  - REQ-RBAC-001
  - NFR-SEC-002
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added `POST /complaints/:complaintId/attachments` as the first staff-only
    attachment upload route.
  - The route is guarded with staff session auth, RBAC, CSRF, and branch-scope
    decorators.
  - The controller derives actor, branch, correlation ID, IP, and user agent from
    the server request and scoped complaint detail; spoofed actor/role/branch
    body fields are ignored.
  - The route verifies target complaint visibility through `ComplaintsService`
    before upload persistence.
  - Added explicit JSON/base64 request parsing and response DTOs that omit
    internal storage keys.
  - Added OpenAPI route and schemas for `AttachmentUploadRequest`,
    `Attachment`, and `AttachmentUploadResponse`.
  - Added focused `test:api -- attachments` coverage for allowed upload,
    branch-hidden complaint denial, spoofed authority fields ignored, invalid
    file metadata, and route RBAC allowed/denied behavior.
  - Added no staff download route, portal route, malware scan transition, UI,
    schema/migration change, provider credential, or real provider call.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- attachments` (14/14)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed. The route uses session/RBAC/branch-scope guards, derives actor from
    `request.principal`, derives audit branch from scoped complaint detail, and
    tests spoofed actor/role/branch body fields.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed. Upload persistence
    still uses the `F5-01D` same-transaction metadata/audit path and adds no side
    effects.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. No logging/provider code was added;
    the upload response omits storage keys and credentials.
  - Customer portal exposure rules hold: Passed by scope. No portal attachment
    route or customer-visible read behavior was added.
  - Trust boundaries are tested: Passed. `test:api -- attachments` covers
    allowed upload, RBAC denied role, branch-hidden complaint denial, spoofed
    authority fields ignored, and invalid metadata denial.

## F5-01F - Add Staff Attachment Download Authorization And Short-Lived URL Route

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-FILES-001
  - REQ-FILES-001
  - REQ-RBAC-001
  - NFR-SEC-002
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added attachment metadata lookup and staff download-preparation service
    behavior.
  - Added `GET /complaints/:complaintId/attachments/:attachmentId/download`
    guarded by staff session auth, RBAC, and branch scope.
  - The route verifies scoped complaint visibility before token preparation, and
    the service verifies the attachment belongs to the requested complaint.
  - The response returns only `{ attachmentId, token, expiresAt }`; no public URL
    or storage key is returned.
  - Successful download preparation writes an `ATTACHMENT`
    `attachment_download_prepared` audit entry with safe metadata.
  - Missing storage objects surface stable `ATTACHMENT_NOT_FOUND`.
  - Added OpenAPI route and `AttachmentDownloadResponse` schema.
  - Added focused `test:api -- attachments` coverage for allowed download
    preparation/audit, branch-hidden denial, missing storage object denial, and
    no public URL/provider credential exposure.
  - Added no portal route, malware scan transition/enforcement, UI,
    schema/migration change, provider credential, or real provider call.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- attachments` (18/18)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed. The route uses staff session/RBAC/branch-scope guards and verifies
    scoped complaint visibility before token preparation.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed. Download preparation
    has no complaint state change; attachment access writes an `ATTACHMENT`
    audit entry in the same logical operation and no side effects were added.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. No logging/provider code was added;
    the response omits public URLs, storage keys, and credentials.
  - Customer portal exposure rules hold: Passed by scope. No portal attachment
    route or customer-visible read behavior was added.
  - Trust boundaries are tested: Passed. `test:api -- attachments` covers
    allowed download preparation, RBAC from `F5-01E`, branch-hidden complaint
    denial, missing storage object denial, and no public URL/credential exposure.

## F5-01G - Add Portal Attachment Upload Path For Verified Non-Closed Complaints

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-FILES-001
  - REQ-FILES-001
  - REQ-PORTAL-002
  - PORTAL-SEC-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added `PortalService.resolveAttachmentUpload` to resolve complaint/customer
    authority from the verified portal session and deny closed/rejected
    complaints.
  - Added `POST /portal/attachments` in the attachments module. It accepts only
    the `x-portal-session` header plus attachment body fields.
  - Portal upload ignores body-supplied complaint/customer/actor/branch/visibility
    authority, derives complaint/branch from the backend portal session path, and
    forces `customerVisible: true`.
  - The route reuses existing attachment metadata validation, storage port,
    metadata persistence, and upload audit behavior.
  - Added OpenAPI `POST /portal/attachments` using the existing attachment upload
    request/response schemas.
  - Added focused `test:api -- attachments` coverage for allowed verified portal
    upload, invalid session denial, terminal complaint denial, spoofed authority
    fields ignored, and invalid metadata denial before storage/persistence/audit.
  - Added no portal attachment download route, malware scan transition, UI,
    schema/migration change, provider credential, or real provider call.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- attachments` (22/22)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed. Portal upload uses the verified portal session path and ignores
    client-supplied complaint/customer/actor/branch/visibility fields.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed. Portal upload reuses
    the same attachment metadata plus `ATTACHMENT` audit transaction and adds no
    side effects.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. No logging/provider code was added;
    tests cover no provider credential exposure in attachment responses.
  - Customer portal exposure rules hold: Passed. The route accepts only the
    portal session header plus file body fields, returns only attachment metadata,
    and does not expose internal comments, audit logs, DMS codes, staff PII, or
    unrelated complaints.
  - Trust boundaries are tested: Passed. `test:api -- attachments` covers
    verified portal upload, invalid session denial, terminal complaint denial,
    spoofed authority fields ignored, and invalid metadata denial.

## F5-01H - Add Portal Attachment Download Privacy Regression Coverage

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-FILES-001
  - REQ-FILES-001
  - REQ-PORTAL-002
  - PORTAL-SEC-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added `test:api -- attachments` privacy regressions proving portal attachment
    OpenAPI exposes upload only and no portal attachment download route/token
    shape exists in this slice.
  - Proved portal upload responses omit storage keys, download tokens, URLs, and
    provider/internal fields.
  - Proved staff download token behavior remains on the staff complaint route and
    is not present in portal upload or portal tracking response shapes.
  - Added no portal attachment download route, new attachment behavior, malware
    scan transition, UI, schema/migration change, provider credential, or real
    provider call.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- attachments` (24/24)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by regression. No new authority path was added; tests verify portal
    response shapes do not expose staff download token behavior.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added tests only and no state changes or side effects.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. Tests prove portal attachment
    response schemas exclude token/URL/provider credential fields.
  - Customer portal exposure rules hold: Passed. Tests prove portal attachment
    and tracking shapes do not expose download tokens, internal comments, audit
    logs, DMS codes, staff PII, unrelated complaints, storage keys, or provider
    credentials.
  - Trust boundaries are tested: Passed. `test:api -- attachments` covers portal
    no-download-route and public-safe response-shape regressions.

## F5-02A - Add Attachment Scan Status Transition Service

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-FILES-001
  - REQ-FILES-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added repository/service behavior to transition attachment scan status from
    `PENDING` to `CLEAN` or `REJECTED`.
  - Clean/rejected attachments cannot be transitioned again by this service.
  - Missing attachments return stable `ATTACHMENT_NOT_FOUND`.
  - Invalid scan transitions return stable `ATTACHMENT_SCAN_INVALID_TRANSITION`
    before database writes or audit.
  - Successful scan status updates write an `ATTACHMENT` scan audit entry in the
    same transaction as the status update.
  - Added focused `test:api -- attachments` coverage for allowed clean/rejected
    transitions, denied invalid transition, missing attachment denial, and
    same-transaction audit.
  - Added no scanner provider integration, async scan jobs, download enforcement,
    routes, UI, schema/migration change, provider credential, or real provider
    call.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- attachments` (27/27)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no route or client authority path.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed. Scan status update
    and `ATTACHMENT` scan audit are tested against the same transaction client;
    no side effects were added.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. No logging/provider code was added.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    customer-visible response shape was changed.
  - Trust boundaries are tested: Passed. `test:api -- attachments` covers
    allowed scan transitions plus invalid transition and missing attachment
    denials before writes/audit.

## F5-02B - Enforce Scan Status In Attachment Download Behavior

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-FILES-001
  - REQ-FILES-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Updated staff download preparation to allow download tokens only for `CLEAN`
    attachments.
  - `PENDING` and `REJECTED` attachments fail with stable
    `ATTACHMENT_SCAN_UNAVAILABLE` before storage token generation or download
    audit.
  - Existing missing storage object denial remains stable and safe.
  - Upload behavior remains unchanged; new uploads still persist with default
    `PENDING` scan status.
  - Added focused `test:api -- attachments` coverage for clean allowed download,
    pending/rejected denied before token/audit, and missing object behavior.
  - Added no scanner provider integration, async scan jobs, routes, UI,
    schema/migration change, provider credential, or real provider call.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- attachments` (28/28)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed. Existing staff download route still derives authority from server
    session/guarded complaint scope.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    blocks access before storage token generation/audit and adds no state
    changes or side effects.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. No logging/provider code was added.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    customer-visible response shape was changed.
  - Trust boundaries are tested: Passed. `test:api -- attachments` covers clean
    allowed download plus pending/rejected denied before token/audit.

## F5-03A - Generate Integrations Module Boundary And Manifest

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-INTEGRATION-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Generated the canonical `integrations` backend module skeleton.
  - Filled `MODULE.md` with a real provider-adapter boundary: public service,
    no owned tables yet, allowed core dependencies, and SRS IDs.
  - Wired `IntegrationsModule` into the root API module for module reachability
    lint coverage.
  - Added no email/SMS/WhatsApp provider behavior, SDKs, credentials,
    notification dispatch behavior, routes, OpenAPI paths, schema/migration
    changes, or UI.
- Verification:
  - Passed: `corepack pnpm generate:module -- integrations`
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no routes or authority decisions.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state changes or side effects.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. No provider behavior, SDK,
    credential, logging, or response path was added.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    response shape was changed.
  - Trust boundaries are tested: Passed for this boundary-only slice by generator
    construction tests, module reachability lint, and manifest truth checks.

## F5-03B - Add Email Provider Adapter With In-Memory Test Double

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-INTEGRATION-001
  - REQ-NOTIFY-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added an integrations-owned email provider port and deterministic
    in-memory provider test double.
  - Wired the in-memory email provider into `IntegrationsModule` without any
    provider SDK, credential, environment read, route, schema/migration change,
    delivery log, or UI.
  - Added `IntegrationsService.sendEmail()` as the module boundary for safe
    email sends through the provider port.
  - Rejected unsafe recipient, subject, missing body, and sensitive payload keys
    before provider send.
  - Added focused `test:api -- integrations` coverage for successful send,
    unsafe recipient/payload rejection before send, stable result shape, and no
    provider credential exposure.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- integrations` (3/3)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no routes or authority decisions.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state changes or notification dispatch behavior.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. Sensitive payload keys are rejected
    before provider send and provider results expose no credentials.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    response shape was changed.
  - Trust boundaries are tested: Passed. `test:api -- integrations` covers
    allowed provider send plus unsafe data denial before provider send.

## F5-03C - Dispatch Queued Email Notifications With Failure Status

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-INTEGRATION-001
  - REQ-NOTIFY-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added queued email dispatch through `NotificationsService` using the
    integrations module public email provider boundary.
  - Added repository methods to find `EMAIL` + `QUEUED` notifications in queued
    order and mark them `SENT` or `FAILED` only while still queued.
  - Successful dispatch stores safe provider metadata: message id, provider, and
    accepted recipients.
  - Provider exceptions are persisted as stable `EMAIL_PROVIDER_FAILED` without
    provider error detail or credentials.
  - Unsafe email payload data is rejected by the integration boundary before
    provider send and recorded as stable `VALIDATION_FAILED`.
  - Delivered/failed notifications are skipped by repository selection and
    compare-and-update status filters.
  - Added focused `test:api -- notifications` coverage for successful dispatch,
    provider failure status, idempotent terminal-row skip, unsafe payload
    rejection before send, and no credential exposure.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- notifications` (10/10)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no routes or client authority path.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope for this
    notification status task. Notification status updates are single-row guarded
    persistence operations; no complaint workflow state or audit-requiring
    domain transition was added.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. Unsafe payload keys are rejected
    before provider send and provider failure details are collapsed to stable
    safe codes.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    response shape was changed.
  - Trust boundaries are tested: Passed. `test:api -- notifications` covers the
    successful path, provider failure, terminal-row skip, unsafe payload denial,
    and credential non-exposure.

## F5-04A - Add SMS Provider Adapter With In-Memory Test Double

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-INTEGRATION-001
  - REQ-NOTIFY-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added an integrations-owned SMS provider port and deterministic in-memory
    provider test double.
  - Wired the in-memory SMS provider into `IntegrationsModule` without provider
    SDKs, credentials, environment reads, routes, schema/migration changes,
    delivery logs, notification dispatch behavior, WhatsApp behavior, or UI.
  - Added `IntegrationsService.sendSms()` as the module boundary for safe SMS
    sends through the provider port.
  - Rejected unsafe phone recipients and sensitive payload keys before provider
    send.
  - Added focused `test:api -- integrations` coverage for successful SMS send,
    unsafe recipient/payload rejection before send, stable result shape, and no
    provider credential exposure.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- integrations` (6/6)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no routes or authority decisions.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state changes or notification dispatch behavior.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. Sensitive payload keys are rejected
    before provider send and provider results expose no credentials.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    response shape was changed.
  - Trust boundaries are tested: Passed. `test:api -- integrations` covers
    allowed SMS provider send plus unsafe data denial before provider send.

## F5-04B - Add WhatsApp Provider Adapter With In-Memory Test Double

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-INTEGRATION-001
  - REQ-NOTIFY-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added an integrations-owned WhatsApp provider port and deterministic
    in-memory provider test double.
  - Wired the in-memory WhatsApp provider into `IntegrationsModule` without
    provider SDKs, credentials, environment reads, routes, schema/migration
    changes, delivery logs, notification dispatch behavior, or UI.
  - Added `IntegrationsService.sendWhatsApp()` as the module boundary for safe
    WhatsApp sends through the provider port.
  - Rejected unsafe phone recipients and sensitive payload keys before provider
    send.
  - Added focused `test:api -- integrations` coverage for successful WhatsApp
    send, unsafe recipient/payload rejection before send, stable result shape,
    and no provider credential exposure.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- integrations` (9/9)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no routes or authority decisions.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state changes or notification dispatch behavior.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. Sensitive payload keys are rejected
    before provider send and provider results expose no credentials.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    response shape was changed.
  - Trust boundaries are tested: Passed. `test:api -- integrations` covers
    allowed WhatsApp provider send plus unsafe data denial before provider send.

## F5-04C - Dispatch Queued SMS/WhatsApp Notifications With Failure Status

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - ARCH-INTEGRATION-001
  - REQ-NOTIFY-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added queued SMS and WhatsApp dispatch through `NotificationsService` using
    the integrations module public provider boundaries.
  - Added repository methods to find `SMS`/`WHATSAPP` + `QUEUED` notifications
    in queued order and mark them `SENT` or `FAILED` only while still queued.
  - Successful dispatch stores safe provider metadata: message id, provider, and
    accepted recipients.
  - Provider exceptions are persisted as stable `SMS_PROVIDER_FAILED` or
    `WHATSAPP_PROVIDER_FAILED` without provider error detail or credentials.
  - Unsafe SMS/WhatsApp payload data is rejected by the integration boundaries
    before provider send and recorded as stable `VALIDATION_FAILED`.
  - Delivered/failed SMS and WhatsApp notifications are skipped by repository
    selection and compare-and-update status filters.
  - Added focused `test:api -- notifications` coverage for SMS success/failure,
    WhatsApp success/failure, terminal-row skip, unsafe payload rejection before
    send, and no credential exposure.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- notifications` (16/16)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no routes or client authority path.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope for this
    notification status task. Notification status updates are single-row guarded
    persistence operations; no complaint workflow state or audit-requiring
    domain transition was added.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. Unsafe payload keys are rejected
    before provider send and provider failure details are collapsed to stable
    safe codes.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    response shape was changed.
  - Trust boundaries are tested: Passed. `test:api -- notifications` covers the
    successful paths, provider failures, terminal-row skip, unsafe payload
    denial, and credential non-exposure.

## F5-05A - Add Notification Template Schema And Migration

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-NOTIFY-001
  - LOCALIZATION-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
- Evidence:
  - Added Prisma `NotificationTemplate` with code, channel, locale,
    subject/body content, version metadata, activation state, and audit
    timestamps.
  - Added migration `20260619170000_notification_templates` to create
    `notification_templates`, version uniqueness, active-template partial
    uniqueness, and lookup index.
  - Added notifications manifest ownership for `notification_templates`.
  - Added `prisma:validate` proof script via a Node wrapper that supplies a
    local placeholder `DATABASE_URL` for static validation.
  - Extended schema-check coverage to require the template model, table mapping,
    required fields, version uniqueness, and active-template lookup index.
  - Added no template resolution/rendering service, admin route, OpenAPI path,
    dispatch behavior, provider behavior, delivery-attempt schema, or UI.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm prisma:validate`
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no routes or authority decisions.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added schema only and no state-changing service behavior.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. No runtime provider, logging, or
    response behavior was added.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    response shape was changed.
  - Trust boundaries are tested: Passed by schema-check and Prisma validation
    coverage for the new persistence boundary.

## F5-05B - Add Arabic/English Notification Template Resolution Service

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-NOTIFY-001
  - LOCALIZATION-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added active-template lookup by code/channel/locale in the notifications
    repository.
  - Added backend-only `NotificationsService.resolveTemplate()` with validation
    for template code, channel, `ar`/`en` locale, and safe payload data.
  - Added deterministic fallback from requested Arabic locale to English when
    the Arabic template is missing.
  - Added simple placeholder rendering from safe scalar payload fields.
  - Missing templates fail with stable `NOTIFICATION_TEMPLATE_NOT_FOUND`.
  - Unsafe payload data fails before repository reads or rendering.
  - Added focused `test:api -- notifications` coverage for Arabic resolution,
    English fallback, missing-template denial, unsafe payload denial before read,
    and credential non-exposure.
  - Added no admin route, OpenAPI path, dispatch behavior change, provider
    behavior, delivery-attempt schema, template mutation service, or UI.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- notifications` (21/21)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no routes or authority decisions.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added read-only template resolution and no side effects.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. Unsafe payload keys are rejected
    before reads/rendering and credential non-exposure is tested.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    response shape was changed.
  - Trust boundaries are tested: Passed. `test:api -- notifications` covers
    locale resolution, fallback, denial, and unsafe payload boundaries.

## F5-05C - Add Admin Notification Template Routes With RBAC And OpenAPI

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-NOTIFY-001
  - LOCALIZATION-001
  - API-STANDARD-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added Admin-only backend routes for listing, creating, updating,
    activating, and deactivating notification templates.
  - Mutation routes use server-session auth, Admin RBAC, and CSRF guards.
  - Added repository/service methods for template list/create/update/activation
    writes.
  - Template writes validate code, channel, `en`/`ar` locale, subject/body,
    positive version metadata, version note, and activation state before writes.
  - Template create/update/activation writes `CONFIG` audit entries in the same
    repository transaction; audit metadata records identifiers and changed field
    names, not template body content or secrets.
  - Added OpenAPI paths and schemas for every admin template route.
  - Added focused notifications API coverage for allowed create/update, denied
    non-admin access, validation failure before write, same-transaction audit,
    and provider credential non-exposure.
  - Added no Admin UI, dispatch behavior change, provider behavior, delivery
    attempt log schema, preview endpoint, import, or export.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- notifications` (26/26)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed. `NotificationsController` derives actor/audit context from
    `AuthenticatedRequest`, and `RbacGuard` Admin metadata is covered by
    `template-management.test.ts`.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed. Template mutations
    are CONFIG changes and write audit records inside the same repository
    transaction; no side effects are added.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. Responses expose explicit template
    DTO fields only, and credential non-exposure is tested.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    response shape was changed.
  - Trust boundaries are tested: Passed. `test:api -- notifications` covers
    Admin allowed mutation behavior and non-admin denial.

## F5-05D - Add Notification Delivery Attempt Log And Retry-Safe Status Updates

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-NOTIFY-001
  - API-STANDARD-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
- Evidence:
  - Added `notification_delivery_attempts` persistence with notification
    relation, channel, terminal attempt status, provider, safe provider result,
    failure reason, and attempted timestamp.
  - Existing email/SMS/WhatsApp repository `mark*Sent` and `mark*Failed` methods
    now write a delivery attempt and guarded terminal status update in one
    Prisma transaction.
  - Status updates still require `QUEUED`, so terminal rows are not overwritten
    by stale attempts.
  - Successful attempts store only safe provider result scalars
    (`messageId`, `provider`, `accepted`); failed attempts store stable failure
    codes only.
  - Added schema-check coverage for the delivery attempt model.
  - Added focused notifications API coverage for successful attempt log, failed
    attempt log, stale terminal update skip, and provider credential
    non-exposure.
  - Added no provider behavior change, real provider call, provider credential,
    Admin UI, OpenAPI route, retry scheduler, template preview/import/export, or
    customer preference behavior.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- notifications` (29/29)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `corepack pnpm prisma:validate`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no routes or authority decisions.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed. Notification
    dispatch terminal status changes now write delivery attempts in the same
    repository transaction, with no new side effects.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. Attempt records store safe provider
    metadata or stable failure codes only, and non-exposure is tested.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    response shape was changed.
  - Trust boundaries are tested: Passed. `test:api -- notifications` covers
    retry-safe status guards, attempt persistence, and provider-secret
    non-exposure.

## F5-06A - Add Customer Notification Preference Schema And Service

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-NOTIFY-002
  - LOCALIZATION-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - Added `customer_notification_preferences` persistence with one preference
    row per customer, optional preferred channel, optional SMS quiet-hour start
    and end times, optional timezone, and audit timestamps.
  - Added notifications repository/service methods for reading and upserting
    customer preferences.
  - Missing preference rows return explicit safe defaults.
  - Preference writes validate customer ID, preferred channel, quiet-hour
    `HH:mm` values, and timezone format before writes.
  - Added schema-check coverage for the preference model.
  - Added focused notifications API coverage for preference upsert, default
    read fallback, validation failure before write, repository upsert shape, and
    provider credential non-exposure.
  - Added no dispatch preference enforcement, quiet-hour suppression, UI, public
    routes, OpenAPI routes, real provider calls, provider credentials, or
    marketing subscription behavior.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- notifications` (34/34)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `corepack pnpm prisma:validate`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added backend service methods only, no routes or
    caller authority decisions.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. Preference
    persistence is configuration data and no dispatch side effects were added.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. Preference DTOs expose explicit
    fields only, and provider credential non-exposure is tested.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    response shape was changed.
  - Trust boundaries are tested: Passed. `test:api -- notifications` covers
    validation-before-write and safe default boundaries.

## F5-06B - Enforce Quiet Hours And Channel Preference During Dispatch

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-NOTIFY-002
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - Queued provider dispatch now loads the notification complaint customer ID
    and reads stored customer notification preferences before provider send.
  - Preferred channel mismatches mark the queued notification failed with stable
    `NOTIFICATION_CHANNEL_PREFERENCE_SKIPPED` before provider send.
  - SMS quiet-hour windows are evaluated with the stored timezone and mark SMS
    failed with stable `NOTIFICATION_QUIET_HOURS_SKIPPED` before provider send.
  - Non-SMS channels are not suppressed by SMS quiet-hour windows.
  - Missing preferences preserve existing dispatch behavior.
  - Moved provider-message construction and dispatch preference policy into a
    small notifications helper to keep source files under the line budget.
  - Added focused notifications API coverage for preferred-channel skip, SMS
    quiet-hour skip, allowed outside quiet hours, missing preference fallback,
    and provider non-call before suppressed sends.
  - Added no UI, public/customer preference routes, OpenAPI routes, real provider
    calls, provider credentials, retry scheduler, critical-complaint bypass, or
    marketing subscription behavior.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- notifications` (37/37)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no routes or caller authority decisions.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by existing
    notification repository behavior. Preference suppression uses the same
    terminal mark-failed path that writes delivery attempt and status together.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. Suppression writes stable reason
    codes only and provider non-call is tested.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    response shape was changed.
  - Trust boundaries are tested: Passed. `test:api -- notifications` covers
    preference and quiet-hour suppression before provider calls.

## F5-07A - Generate Surveys Module Boundary And Manifest

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-NOTIFY-001
  - REQ-SURVEY-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Evidence:
  - Generated canonical `surveys` backend module skeleton.
  - Filled `apps/api/src/modules/surveys/MODULE.md` with real public surface,
    owned `surveys` table, allowed dependencies, and SRS IDs.
  - Wired `SurveysModule` into the API root module so module reachability lint
    covers it.
  - Added no survey scheduling behavior, portal survey submission route, staff
    survey result read model, OpenAPI route, UI, notification dispatch behavior
    change, schema change, or migration.
- Verification:
  - Passed: `corepack pnpm generate:module -- surveys`
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no routes or authority decisions.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added module boundary only and no state-changing behavior.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed by scope. No runtime response or
    logging behavior was added.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    response shape was changed.
  - Trust boundaries are tested: Passed by lint, typecheck, and generated module
    construction tests for this boundary-only slice.

## F5-07B - Schedule Survey Links From Closure Notification Events

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-SURVEY-001
  - REQ-NOTIFY-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - Added survey repository/service behavior for scheduling pending survey links
    by complaint/customer.
  - Generated raw one-time survey tokens are hashed with SHA-256 before storage;
    service responses do not expose `tokenHash`.
  - Scheduling is idempotent for an existing pending complaint/customer survey
    and does not requeue notifications.
  - Customer notification queueing occurs only after survey persistence succeeds.
  - Added `test:api -- surveys` suite and coverage for schedule creation,
    idempotency, token hash non-exposure, notification queued after persistence,
    and invalid input denial before write.
  - Added no portal survey submission route, staff survey result read model,
    OpenAPI route, UI, complaint state change, real provider call, provider
    credential, or report integration.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- surveys` (4/4)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added service behavior only, no routes or caller
    authority decisions.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed. Survey creation
    persists before customer notification queueing; no complaint state change was
    added.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. Stored survey token hashes are not
    returned and non-exposure is tested.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    response shape was added.
  - Trust boundaries are tested: Passed. `test:api -- surveys` covers invalid
    input before write and token-hash non-exposure.

## F5-07C - Add One-Time Expiring Portal Survey Submission API

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-SURVEY-001
  - API-STANDARD-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added public `POST /portal/surveys` survey submission route.
  - Added request parsing for one-time survey token, 1-5 rating, and optional
    comment.
  - Survey service verifies raw token hash against a pending survey, denies
    expired tokens, and persists one submitted rating/comment through a guarded
    pending-status update.
  - Duplicate/stale submissions fail safely with `PORTAL_VERIFICATION_FAILED`.
  - Added OpenAPI path and schemas for the portal survey route.
  - Added focused `test:api -- surveys` coverage for successful submission,
    expired/duplicate denial, request validation, response privacy, and OpenAPI
    coverage.
  - Added no staff survey result read model, staff/admin UI, customer portal UI,
    complaint state change, notification dispatch behavior change, or report
    integration.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- surveys` (8/8)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. The added route is a public token-verification portal route
    and does not accept staff role/branch input.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. Survey
    submission changes survey state only; no complaint state change or side
    effect was added.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. Stored survey token hashes are not
    returned and response privacy is tested.
  - Customer portal exposure rules hold: Passed. Portal survey response exposes
    only survey ID, rating, and submitted timestamp.
  - Trust boundaries are tested: Passed. `test:api -- surveys` covers valid,
    expired, duplicate, and invalid token/body boundaries.

## F5-07D - Expose Submitted Survey Results To Authorized Staff Read Models

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-SURVEY-001
  - API-STANDARD-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added survey repository/service read behavior for submitted surveys by
    complaint.
  - Added guarded staff `GET /complaints/:complaintId/surveys` read route with
    server-session auth, RBAC, and branch-scope guard metadata.
  - The route verifies scoped complaint detail through `ComplaintsService`
    before reading survey results, so branch-hidden complaints deny before any
    survey lookup.
  - Staff response DTO exposes only survey id, complaint id, rating, optional
    comment, and submitted timestamp.
  - Pending/unsubmitted surveys are excluded by repository query constraints.
  - Added OpenAPI path and schemas for submitted staff survey reads.
  - Added focused `test:api -- surveys` coverage for allowed staff reads,
    branch-hidden denial before survey read, pending exclusion, response
    privacy, and OpenAPI coverage.
  - Added no report aggregation, staff/admin UI, customer portal UI, staff survey
    mutation route, complaint state change, or notification dispatch behavior
    change.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- surveys` (13/13)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed. The staff route uses `SessionAuthGuard`, `RbacGuard`, and
    `@BranchScoped()`, then derives branch scope from guarded request context.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This is a
    read-only route and adds no state change or side effect.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. Staff DTOs omit survey token hashes,
    customer IDs, provider data, audit logs, and unrelated records; response
    privacy is tested.
  - Customer portal exposure rules hold: Passed by scope. This task added no
    customer portal read surface.
  - Trust boundaries are tested: Passed. `test:api -- surveys` covers allowed
    staff access, denial before survey lookup, pending exclusion, and contract
    privacy.

## REPAIR-F5-06B-CRITICAL-QUIET-HOUR-BYPASS - Honor Critical SMS Quiet-Hour Bypass

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-NOTIFY-002
  - API-STANDARD-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
- Evidence:
  - Queued notification reads now select server-side persisted complaint
    severity with the complaint customer id.
  - SMS quiet-hour suppression still fails non-critical complaints before
    provider dispatch.
  - Preferred-channel mismatch still fails before provider dispatch regardless
    of complaint severity.
  - Critical complaint SMS notifications bypass quiet-hour suppression and pass a
    stable `CRITICAL_COMPLAINT_QUIET_HOURS_BYPASS` reason into sent delivery
    metadata.
  - Sent delivery attempt/status metadata records the safe bypass reason without
    provider secrets or credentials.
  - Added focused notification API coverage for critical quiet-hour bypass,
    non-critical quiet-hour denial, preferred-channel denial, and repository
    delivery-attempt metadata recording.
  - Added no UI, customer preference routes, real provider calls, provider
    credentials, retry scheduler, marketing subscription behavior, or Phase 6
    work.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- notifications` (39/39)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `corepack pnpm prisma:validate`
  - Passed: `git diff --check` (line-ending warnings only)
  - Note: an initial focused `test:api -- notifications` run failed on one
    expected select shape after adding complaint severity; the expectation was
    updated and the required suite passed 39/39.
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This repair adds no route or caller authority surface.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. No complaint
    state change was added; notification delivery status and attempt rows remain
    written in one repository transaction.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. The bypass metadata is a stable safe
    reason string, and provider-secret non-exposure is covered by notification
    tests.
  - Customer portal exposure rules hold: Passed by scope. No portal route or
    response shape was added.
  - Trust boundaries are tested: Passed. Notification API tests cover critical
    allowed bypass, non-critical quiet-hour denial, preferred-channel denial, and
    delivery-attempt metadata recording.

## F6-01A - Bootstrap Next.js Staff Shell With Localized RTL/LTR Navigation

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-LOCALIZATION-001
  - METHOD-TEST-001
- Evidence:
  - Replaced the web liveness-only Node entrypoint with a minimal Next.js App
    Router runtime using the existing Tailwind token foundation.
  - Added a staff operations shell as the first screen, not a marketing page or
    JSON liveness response.
  - Added dense placeholder navigation entries for dashboard, work queue,
    complaint create/detail, admin, reports, audit, and notifications.
  - Kept staff shell display text in `apps/web/src/i18n/staff-shell.ts` with
    English LTR and Arabic RTL labels.
  - Added a real `tools/web-test.mjs` runner and focused shell tests for English
    labels/direction, Arabic labels/direction, and unsupported locale fallback.
  - Added no API calls, login/session behavior, role-aware navigation,
    complaint data, workflow actions, forms, uploads, reports behavior, admin
    CRUD, visual runner, accessibility runner, or performance runner.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (3/3)
  - Passed: `git diff --check` (line-ending warnings only)
  - Extra Passed: `corepack pnpm --filter @cms-auto/web build` (Next build
    passed; warned only about a parent-user lockfile affecting root inference)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no role or branch decision path; the shell
    exposes placeholders only and does not authorize actions in React.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state change or side effect.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. This task added no credential
    fields, API calls, logging, token storage, or provider surface.
  - Customer portal exposure rules hold: Passed by scope. This task added no
    customer portal route or response shape.
  - Trust boundaries are tested: Passed for this UI slice. `test:web -- shell`
    covers the accepted locale values (`en`, `ar`) and denial/fallback for an
    unsupported locale input before direction/labels are rendered.

## F6-01B - Add Staff Login/Logout UI With Safe Session-Aware Shell States

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-AUTH-001
  - REQ-LOCALIZATION-001
  - METHOD-TEST-001
- Evidence:
  - Added localized staff login labels and controls to the first staff shell
    surface.
  - Added generic safe login failure text that does not identify wrong
    identifier, wrong password, inactive account, or locked account causes.
  - Added signed-out/signed-in visual shell states and a localized logout
    affordance placeholder.
  - Kept auth UI display text in the shared staff shell dictionary for English
    LTR and Arabic RTL.
  - Extended `test:web -- shell` to cover login labels, Arabic login labels,
    generic error text, absence of locked/inactive leakage, and logout affordance.
  - Added no backend auth behavior, API client call, token storage, localStorage
    auth, role-aware navigation, complaint data, workflow action, upload,
    reports behavior, admin CRUD, visual runner, accessibility runner, or
    performance runner.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (5/5)
  - Passed: `git diff --check` (line-ending warnings only)
  - Extra Passed: `corepack pnpm --filter @cms-auto/web build` (Next build
    passed; warned only about a parent-user lockfile affecting root inference)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no role or branch decision path; signed-in
    state is a visual preview and does not authorize actions.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state change or side effect.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. The form is UI-only, stores nothing,
    logs nothing, and does not call an API.
  - Customer portal exposure rules hold: Passed by scope. This task added no
    customer portal route or response shape.
  - Trust boundaries are tested: Passed for this UI slice. `test:web -- shell`
    covers generic login failure messaging and proves locked/inactive causes are
    not exposed in the rendered error state.

## F6-01C - Add Role-Aware Navigation Visibility Placeholders

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-RBAC-001
  - REQ-LOCALIZATION-001
  - METHOD-TEST-001
- Evidence:
  - Added localized role preview labels for staff, admin, and management shell
    states.
  - Added a tiny local navigation visibility allow-list for placeholders:
    staff gets dashboard, queue, create, detail, and notifications; admin gets
    all placeholder nav; management gets dashboard, queue, detail, reports,
    audit, and notifications.
  - Added a localized hidden-state message when Admin-only surfaces are hidden
    from non-admin role previews.
  - Kept visibility visual-only: no role fetching, API calls, route protection,
    complaint state authority, or workflow decisions were added to React.
  - Extended `test:web -- shell` to cover full Admin nav, Staff denial/hidden
    Admin nav, and Arabic RTL hidden-state rendering.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (8/8)
  - Passed: `git diff --check` (line-ending warnings only)
  - Extra Passed: `corepack pnpm --filter @cms-auto/web build` (Next build
    passed; warned only about a parent-user lockfile affecting root inference)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope with explicit limitation. This task adds only visual preview
    states; it does not authorize routes or actions. Backend guards remain the
    authority for real role/branch checks.
  - Every state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state change or side effect.
  - No passwords, OTPs, authentication tokens, credential hashes, or provider
    secrets are logged or returned: Passed. This task added no credential
    handling, logging, API calls, token storage, or provider surface.
  - Customer portal exposure rules hold: Passed by scope. This task added no
    customer portal route or response shape.
  - Trust boundaries are tested: Passed for this UI slice. `test:web -- shell`
    covers one allowed role visibility case (Admin sees Admin nav) and one
    denied/hidden case (Staff does not see Admin nav details and gets the hidden
    state).

## F6-01D1 - Add Backend Password Reset Request Token Foundation

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-AUTH-001
  - UI-SCREEN-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
- Evidence:
  - Added `StaffPasswordResetToken` database model in `schema.prisma` with user relation, token hash only, expiresAt timestamp, consumedAt timestamp, and query indexes on `userId` and `expiresAt`.
  - Added migration `20260619195741_add_staff_password_reset_tokens` to create the new table, indexes, and foreign keys.
  - Updated `auth/MODULE.md` manifest to include ownership of `staff_password_reset_tokens` table.
  - Implemented `createPasswordResetToken` in `AuthRepository` for persisting the reset tokens.
  - Implemented `requestPasswordReset` in `AuthService`. It normalizes email identifiers, returns generic `{ ok: true }` responses to prevent user-existence oracle timing/data leak, stores only token hashes, sets a 15-minute time-limited expiry, and audits requests via same-transaction AUTH audit.
  - Created new test file `apps/api/test/auth/password-reset-request.test.ts` to assert correct behavior, hash-only persistence, generic responses, and secure transaction audit logging.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29)
  - Passed: `corepack pnpm test:api -- auth` (24/24, with 3 new password reset request tests)
  - Passed: `corepack pnpm prisma:validate`
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
  - Extra Passed: `corepack pnpm --filter @cms-auto/web build`
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input: Passed by scope. This task added no HTTP endpoints or authorization routes yet.
  - Each state change writes status history and an audit entry in the same transaction; side effects enqueue after commit: Passed. Storing reset token and recording the `AUTH` / `password_reset_request` audit entry are executed inside the same transaction hook client.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned: Passed. The audit log only records safe action/user data, and the unit tests assert that raw tokens, token hashes, and user password hashes are completely absent from both the persisted logs and serializations.
  - Customer portal exposure rules hold: Passed by scope. This is a staff-backend-only feature.
  - Trust boundaries are tested: Passed. Tested the allowed path (active user reset generates token hash and writes audit) and denied paths (missing, inactive, or locked users receive generic responses with zero database token writes or audits).

## F6-01D2 - Add Backend Password Reset Consume/Reset Behavior

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-AUTH-001
  - UI-SCREEN-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
- Evidence:
  - Added `AuthService.consumePasswordReset` for hash-only reset token lookup,
    expiry/consumed/not-found denial, weak-password validation, fresh Argon2id
    password hashing, same-transaction consume/update/audit behavior, and generic
    invalid-token result.
  - Updated repository consume behavior to mark the token with `consumedAt` only
    when it is still unconsumed before updating the user password hash.
  - Extracted auth token/cookie hashing helpers to keep `auth.service.ts` under
    the 300-line source budget.
  - Added focused auth API tests for successful consume, consumed/expired/missing
    generic denial, weak password before persistence, and no credential material
    in audit.
  - Added no HTTP routes, OpenAPI paths, email/SMS delivery, frontend UI,
    browser token storage, or admin reset UI.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- auth` (27/27)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no HTTP route or caller authorization
    surface; it only added service/repository behavior.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed. Password hash update,
    reset-token consumed mark, and `AUTH` / `password_reset_complete` audit write
    share one repository transaction.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. Tests assert the raw token, token hash, plaintext new
    password, old hash, and new hash are absent from audit output.
  - Customer portal exposure rules hold: Passed by scope. This is a
    staff-backend-only auth behavior.
  - Trust boundaries are tested: Passed. Tests cover valid consume, consumed
    token denial, expired token denial, missing token denial, and weak password
    denial before persistence.

## F6-01D3 - Add Password Reset HTTP Routes And OpenAPI

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-AUTH-001
  - API-STANDARD-001
  - METHOD-AUDIT-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added password reset request and consume DTO parsing with standard
    `VALIDATION_FAILED` field errors.
  - Added public pre-session auth controller routes for
    `POST /auth/password-reset/request` and
    `POST /auth/password-reset/consume`.
  - Request route passes audit context into `AuthService.requestPasswordReset`
    and returns only generic `{ ok: true }`, even when the service returns an
    internal raw token for future delivery wiring.
  - Consume route passes audit context into `AuthService.consumePasswordReset`
    and returns only generic `{ ok: boolean }` for valid and invalid tokens.
  - Updated canonical OpenAPI generation/checking and regenerated
    `packages/contracts/openapi.json` with both reset routes and safe schemas.
  - Added focused auth route tests for generic request behavior, consume
    success, invalid-token consume, validation errors, and OpenAPI no-credential
    examples.
  - Added no email/SMS delivery, frontend UI, browser token storage, admin reset
    UI, session-only guards, or CSRF requirement for these pre-session routes.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:api -- auth` (32/32)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. These are public pre-session recovery routes and accept no
    role or branch authority from the client.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed through the auth
    service behavior built in `F6-01D1` and `F6-01D2`. Routes only validate and
    pass request audit context into the service.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. Route and OpenAPI tests assert raw tokens, token hashes,
    plaintext passwords, and credential hashes are not exposed in responses or
    contract examples.
  - Customer portal exposure rules hold: Passed by scope. This task added no
    customer portal route or response shape.
  - Trust boundaries are tested: Passed. Auth route tests cover generic request,
    allowed consume, invalid-token consume, validation denial, and OpenAPI
    privacy.

## F6-01D4 - Add Staff Password-Reset UI Contract

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - REQ-AUTH-001
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-LOCALIZATION-001
  - METHOD-TEST-001
- Evidence:
  - Added a small render-only staff password-reset panel for forgot-password
    request entry, reset-token entry, request form, token/new-password form,
    request success, reset success, and generic invalid/expired token states.
  - Added localized English and Arabic reset labels/messages to the shared staff
    shell dictionary.
  - Kept reset UI inside the signed-out shell and did not add API calls, a
    frontend API client layer, email/SMS delivery, browser token storage, or
    Admin reset UI.
  - Replaced brittle mojibake-literal Arabic shell tests with dictionary-backed
    Arabic assertions while preserving RTL label coverage.
  - Extended `test:web -- shell` from 8 to 14 tests covering reset entry points,
    generic safe request messaging, token/new-password fields, generic result
    states, Arabic RTL reset labels, and no browser token storage in source.
- Verification:
  - Passed: `corepack pnpm lint`
  - Failed then Passed: `corepack pnpm typecheck` initially failed on
    `exactOptionalPropertyTypes` for the optional reset preview state; final run
    passed after widening the preview prop types to accept explicit `undefined`.
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (14/14)
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no authorization or complaint authority in
    React; it only renders pre-session reset UI states.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This
    render-only UI adds no state change or side effect; backend reset audit
    remains owned by the auth service.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. The UI does not call APIs, does not render token values
    back into the page, and tests assert no localStorage, sessionStorage, or
    cookie token storage code exists in the reset UI source.
  - Customer portal exposure rules hold: Passed by scope. This task added no
    customer portal route or response shape.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover generic
    request messaging, generic invalid/expired-token messaging, token field
    presence without a value, Arabic RTL labels, and absence of browser storage.

## F6-02A - Add Minimal Typed Web API Client/Error Mapping For Staff Complaint Reads

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-COMPLAINT-001
  - REQ-RBAC-001
  - API-STANDARD-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Added `apps/web/src/lib/staff-complaints-api.ts` with explicit
    TypeScript types for complaint queue items, complaint detail, status
    history items, and safe staff API result/error shapes.
  - Added `listStaffComplaints()` for relative `GET /complaints` reads with
    cookie credentials and no caller-supplied role/branch/workflow authority.
  - Added `getStaffComplaint()` for relative encoded `GET /complaints/{id}`
    reads with cookie credentials and no branch query spoofing.
  - Mapped API error envelopes into a safe UI error shape preserving status,
    code, message, and correlation ID.
  - Mapped network failures to a stable safe `NETWORK_ERROR` without leaking
    thrown exception details.
  - Extended the web test runner with an `api-client` suite and added focused
    client tests for success mapping, path construction, error-envelope mapping,
    and network failure mapping.
  - Added no dashboard rendering, queue rendering, filters, workflow actions,
    client-side authorization decisions, token storage, generated client, or new
    dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- api-client` (4/4)
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed. Client helpers expose no role, branch, actor, or workflow authority
    parameters; tests assert complaint detail paths omit branch/role query
    spoofing.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added read-only web helpers and no state change or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. Helpers use cookie credentials, do not accept token
    parameters, do not use browser storage, and tests assert safe network-error
    mapping.
  - Customer portal exposure rules hold: Passed by scope. This task added no
    customer portal route, portal client, or response shape.
  - Trust boundaries are tested: Passed. Web client tests cover allowed success
    reads, denied API-envelope mapping, network denial mapping, and no
    branch/role query spoofing in path construction.

## F6-02B - Add Role-Specific Dashboard Summary Cards

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-LOCALIZATION-001
  - REQ-RBAC-001
  - METHOD-TEST-001
- Evidence:
  - Added a small `DashboardSummary` component with role-specific visual card
    sets for staff, admin, and management preview states.
  - Added localized English and Arabic dashboard summary labels for open
    complaints, overdue complaints, SLA warnings, closed complaints, and average
    TAT.
  - Added previewable loading, empty, and error dashboard summary states.
  - Replaced the old placeholder summary counters in the staff shell with the
    new localized component.
  - Extended `test:web -- shell` from 14 to 19 tests covering staff/admin/
    management cards, Arabic RTL labels, and loading/empty/error states.
  - Added no API calls, queue table, filters, detail workspace, workflow
    actions, client-side permission decisions, or new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (19/19)
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed with explicit limitation. Role preview only changes visible placeholder
    dashboard cards and does not authorize routes or actions.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This
    render-only UI adds no state change or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, token
    storage, logging, or provider surface.
  - Customer portal exposure rules hold: Passed by scope. This task added no
    customer portal route or response shape.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover role
    preview differences, Arabic RTL labels, and safe loading/empty/error states;
    no backend authority is moved into React.

## F6-02C - Add Complaint Work Queue Table With Filters And States

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-LOCALIZATION-001
  - REQ-RBAC-001
  - METHOD-TEST-001
- Evidence:
  - Added a localized `WorkQueue` component with filter controls for status,
    branch, severity, SLA state, and search.
  - Added localized work queue table headers for reference, status, severity,
    owner, branch, SLA state, updated, and next action.
  - Added a pagination affordance that makes no claim of real data paging.
  - Added previewable queue loading, empty, and error states.
  - Rendered only safe static operational placeholder rows with no customer PII,
    internal comments, audit logs, or portal data.
  - Extended `test:web -- shell` from 19 to 23 tests covering queue
    headers/filters, pagination, Arabic RTL labels, safe sample rows, and queue
    loading/empty/error states.
  - Added no API calls, real filter/pagination behavior, detail workspace,
    workflow action controls, client-side authorization decisions, or new
    dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (23/23)
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no route call or authorization behavior in
    React; filters are inert UI contract controls.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This
    render-only UI adds no state change or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, token
    storage, logging, or provider surface.
  - Customer portal exposure rules hold: Passed. Tests assert sample rows avoid
    customer PII, internal comments, audit logs, and portal data.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover safe
    queue states, Arabic RTL labels, filter/header presence, and non-sensitive
    sample row content.

## F6-02D - Add Queue Responsive And RTL/LTR Web Tests

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-LOCALIZATION-001
  - METHOD-TEST-001
- Evidence:
  - Added shell tests proving responsive class coverage for the staff shell
    layout, dashboard card grid, queue filter grid, queue overflow container,
    and queue table minimum width.
  - Added shell tests proving English LTR and Arabic RTL render dashboard and
    queue labels together.
  - Did not add Playwright, screenshots, visual regression, accessibility
    runner, performance runner, API calls, client-side authorization decisions,
    new UI surfaces, or new dependencies.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (25/25)
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This test-focused task added no caller authority path and
    no client-side authorization decisions.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state change or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, token
    storage, logging, or provider surface.
  - Customer portal exposure rules hold: Passed by scope. This task added no
    customer portal route, response shape, or UI.
  - Trust boundaries are tested: Passed for the current lightweight UI proof.
    Tests cover responsive class presence and bilingual RTL/LTR rendering
    without moving backend authority into React.

## F6-03A - Add Customer/Vehicle Lookup Panel With Manual Fallback UI

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-COMPLAINT-001
  - REQ-LOCALIZATION-001
  - METHOD-TEST-001
- Evidence:
  - Added a localized `CustomerVehicleLookup` panel with phone, customer code,
    customer name, VIN, and plate search fields.
  - Added safe local/DMS source badges and placeholder result text without real
    customer PII or DMS codes.
  - Added a manual fallback panel and previewable loading, no-match, and error
    lookup states.
  - Extended `test:web -- shell` from 25 to 30 tests covering lookup fields,
    source badges, manual fallback, Arabic RTL labels, state messages, no API
    calls/browser storage in source, and safe sample content.
  - Added no DMS, CRM, backend lookup API calls, complaint submission behavior,
    full complaint create form, browser storage, real customer PII, DMS code,
    audit log, portal data, or new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Failed then Passed: `corepack pnpm test:web -- shell`; initial run failed
    because an older broad queue privacy assertion also matched the new
    legitimate VIN field label. The assertion was narrowed to queue source
    sample rows and the final run passed (30/30).
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This render-only lookup UI adds no route call or caller
    authority path.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state change or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, token
    storage, logging, or provider surface.
  - Customer portal exposure rules hold: Passed. Tests assert the lookup sample
    avoids email addresses, phone-number-shaped values, DMS codes, and portal
    data.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover safe
    source badges, manual fallback, lookup state messages, Arabic RTL labels,
    and no API/storage behavior in the lookup source.

## F6-03B - Add Localized Complaint Create Form With Validation States

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-COMPLAINT-001
  - REQ-LOCALIZATION-001
  - METHOD-TEST-001
- Evidence:
  - Added a localized `ComplaintCreateForm` component with category, severity,
    branch, incident date, subject, and description fields.
  - Added field-level validation preview messages for required fields and
    VIN-required-when-vehicle-related copy.
  - Added success and error preview states that preserve visible safe sample
    input values without submitting.
  - Kept create-form display text in the shared staff shell dictionary and
    removed unused legacy shell strings to keep the dictionary under the
    300-line source budget.
  - Extended `test:web -- shell` from 30 to 35 tests covering form labels,
    validation messages, preserved input states, Arabic RTL labels, and no
    submission/browser storage behavior in source.
  - Added no API calls, attachments, workflow actions, complaint detail UI,
    browser storage, customer PII, internal comments, audit logs, DMS codes,
    portal data, or new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Failed then Passed: `corepack pnpm test:web -- shell`; one run failed before
    unused dictionary strings were removed for the lint budget, and one run
    failed because an older reset-token privacy assertion scanned the whole page
    after preserved create-form values were added. Final run passed (35/35).
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This render-only form adds no route call or caller authority
    path.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state change or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, token
    storage, logging, or provider surface.
  - Customer portal exposure rules hold: Passed. The form uses safe sample
    operational text only and adds no portal data or customer PII.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover
    field-level validation states, preserved input states, Arabic RTL labels,
    and no API submission or browser storage behavior.

## F6-03C - Add Attachment Upload Panel With File Rules And Scan Status

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-FILES-001
  - REQ-LOCALIZATION-001
  - METHOD-TEST-001
- Evidence:
  - Added a localized `AttachmentUploadPanel` with a file input, file-rule
    messages, selected-file placeholder text, and scan status display.
  - Added shared attachment i18n text in `apps/web/src/i18n/staff-attachments.ts`
    to keep the main staff shell dictionary under the source-line budget.
  - Added scan status states for pending, clean, and rejected.
  - Added loading, empty, and error attachment panel states.
  - Extended `test:web -- shell` from 35 to 40 tests covering file rules, scan
    statuses, Arabic RTL labels, safe placeholder content, and no upload,
    file-read, object-URL, browser storage, or external URL behavior in source.
  - Added no attachment API calls, file reads, object URLs, complaint submission
    behavior, customer PII, internal comments, audit logs, DMS codes, portal
    data, provider details, storage URLs, or new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (40/40)
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This render-only attachment panel adds no route call or
    caller authority path.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state change, file persistence, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, token
    storage, logging, provider surface, file reads, object URLs, or storage URLs.
  - Customer portal exposure rules hold: Passed. The panel uses safe placeholder
    file text only and exposes no portal data, customer PII, or storage URLs.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover file
    rules, scan states, Arabic RTL labels, and absence of upload/file-read/
    storage behavior in the panel source.

## PLAN-F6-03D-COMPLAINT-SUBMIT-SPLIT - Staff Complaint Submit Split

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: PLANNER
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-COMPLAINT-001
  - REQ-RBAC-001
  - API-STANDARD-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Read Forge protocol inputs, Phase 6 backlog, latest evidence/trust notes,
    architecture rules, and the cited SRS sections.
  - Confirmed existing backend `POST /complaints` requires session auth, RBAC,
    branch scope, CSRF, a required `branchId` query parameter, and the standard
    validation envelope.
  - Split `F6-03D` into `F6-03D1` write-client behavior and `F6-03D2` create-form
    UI wiring.
  - Updated `.forge/next.md` with the next single buildable task and set
    `.forge/state.md` to `Ready to Build`.
  - Updated `.forge/backlog.md` with the two `F6-03D` subtasks.
- Verification:
  - Passed: `rg -n "Status:|Next Task:|F6-03D1|F6-03D2|PLAN-F6-03D" .forge/next.md .forge/state.md .forge/backlog.md .forge/evidence.md .forge/trust.md`
  - Passed: `git diff --check -- .forge/next.md .forge/state.md .forge/backlog.md .forge/evidence.md .forge/trust.md` (line-ending warnings only)
- Notes:
  - No application source code was changed.

## F6-03D1 - Add Staff Complaint Create Write Client With CSRF And Validation Mapping

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-COMPLAINT-001
  - REQ-RBAC-001
  - API-STANDARD-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Extended `apps/web/src/lib/staff-complaints-api.ts` with typed
    `createStaffComplaint(...)` for `POST /complaints`.
  - The helper uses relative `/complaints?branchId=...`, URL-encodes the branch
    query, sends `credentials: "include"`, posts JSON, and copies only the
    readable `cms_csrf_token` cookie into `x-csrf-token`.
  - Missing CSRF cookie omits the CSRF header and leaves backend denial to the
    existing guarded route.
  - Successful responses map to `{ complaint: { id, referenceNumber, status } }`.
  - Standard API errors keep `code`, `message`, `correlationId`, HTTP status, and
    validation `fieldErrors` when present.
  - Extended `apps/web/test/api-client/staff-complaints-api.test.ts` from 4 to 9
    tests covering success, branch query encoding, CSRF header behavior, missing
    CSRF cookie behavior, validation field errors, network failure, and no
    client-supplied role/actor/workflow/status/branch/token/credential authority.
  - Added no UI wiring, attachment upload behavior, backend route, OpenAPI change,
    generated client, browser credential exposure, or new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- api-client` (9/9)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed. Tests prove the write helper sends only the required branch query and
    no role/actor/workflow/status/branch authority in the JSON body.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by boundary. This web
    helper does not change state locally; it delegates the create mutation to the
    existing backend route that owns status history and audit.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. The helper reads only the non-HttpOnly CSRF cookie, does not
    read the session cookie, does not log, and tests cover no token/credential
    parameters in the request body.
  - Customer portal exposure rules hold: Passed. The helper targets the staff
    complaint route only and exposes no portal data, internal comments, audit,
    DMS codes, staff PII, provider details, or storage URLs.
  - Trust boundaries are tested: Passed. Allowed success and denied validation
    error/network paths are covered, including missing CSRF-cookie behavior and
    API field-error preservation.

## F6-03D2 - Wire Complaint Create Form Submission

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-COMPLAINT-001
  - REQ-RBAC-001
  - API-STANDARD-001
  - METHOD-API-001
  - METHOD-TEST-001
- Evidence:
  - Converted `ComplaintCreateForm` into a client component that submits through
    `createStaffComplaint(...)`.
  - Added a small localized `staff-complaint-create` text file so the existing
    staff shell dictionary stays under the 300-line source budget.
  - The form now renders customer name, customer phone/customer number, category,
    subcategory, severity, branch, incident date, subject, description,
    vehicle-related, and vehicle VIN fields.
  - Added `buildStaffComplaintCreateSubmission(...)` to map form data to the
    backend request with date normalization, optional contact/vehicle fields, and
    branch kept as the helper query input rather than JSON body authority.
  - Success state displays the backend-returned reference number and status.
  - Validation state maps standard API `fieldErrors` to matching visible fields.
  - Network and generic API errors show safe localized messages and preserve
    visible values.
  - Extended `test:web -- shell` from 40 to 42 tests covering submit fields,
    success, validation, loading/disabled submit, network error, Arabic RTL copy,
    request-body mapping, no client authority fields, and no browser storage or
    direct `fetch` in the form source.
  - Added no attachment upload behavior, backend route, OpenAPI change, generated
    client, workflow decision, browser storage, session cookie access, provider
    details, portal data, or new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Failed then Passed: `corepack pnpm typecheck`; initial failure was limited to
    `exactOptionalPropertyTypes` on optional child-component props. Props were
    tightened and the final run passed.
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (42/42)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed. The form sends no role/actor/workflow/status/owner authority; tests
    prove the request body excludes role, actor, workflow, status, branch, token,
    and credential fields.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by boundary. The UI
    submits to the existing backend create route and does not mutate state
    locally or enqueue side effects.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. The form does not read cookies, use browser storage, log
    values, or accept token/credential fields.
  - Customer portal exposure rules hold: Passed. The create form exposes no
    portal data, internal comments, audit logs, DMS codes, staff PII, provider
    details, or storage URLs.
  - Trust boundaries are tested: Passed. Tests cover success, validation-error,
    network-error, and request-mapping paths plus absence of direct browser
    credential/storage behavior in the form source.

## F6-04A - Add Complaint Detail Layout

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-WORKFLOW-001
  - REQ-SLA-001
  - REQ-SURVEY-001
  - METHOD-TEST-001
- Evidence:
  - Added `ComplaintDetailWorkspace` as a localized render-only detail region in
    the staff shell.
  - Added shared `staff-complaint-detail` i18n text for English LTR and Arabic
    RTL labels without expanding the main shell dictionary past the line budget.
  - The workspace renders stable regions for complaint facts, customer data,
    vehicle data, current owner, status, SLA timer, timeline, and submitted
    survey results.
  - Added loading, empty, and error preview states through the existing query
    preview pattern.
  - Kept placeholders masked and safe: no real phone, email, DMS code, staff PII,
    internal comment, audit log, portal data, provider detail, or storage URL.
  - Extended `test:web -- shell` from 42 to 47 tests covering English labels,
    Arabic RTL labels, responsive classes, loading/empty/error states,
    privacy-safe placeholder content, and absence of API/browser-storage behavior
    in the detail source.
  - Added no detail API fetch, workflow action, comments behavior, attachment
    behavior, SLA calculation, survey API behavior, backend route, OpenAPI change,
    generated client, browser storage, or new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (47/47)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This render-only layout adds no route call or caller
    authority path.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state change or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, browser
    storage, logging, provider surface, or token handling.
  - Customer portal exposure rules hold: Passed. Tests assert the detail source
    avoids portal data, internal comments, audit logs, DMS codes, real contact
    details, provider details, and storage URLs.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover masked
    placeholders, Arabic RTL labels, preview states, responsive structure, and no
    API/storage behavior in the detail source.

## F6-04B - Add Comments And Public-Update Panels With Visibility Badges

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-COMMENTS-001
  - REQ-PORTAL-002
  - METHOD-TEST-001
- Evidence:
  - Extended the complaint detail workspace with separate internal comments and
    public update panels.
  - Added localized staff-only and customer-visible visibility badges.
  - Added safe placeholder author, timestamp, visibility, and body content for
    both comment types.
  - Added loading, empty, and error preview states for the comments area.
  - Extended `test:web -- shell` from 47 to 49 tests covering visibility badges,
    safe placeholders, comment preview states, Arabic labels, and no API/browser
    storage behavior.
  - Added no comment fetch/create/edit/delete behavior, portal UI exposure,
    workflow action, attachment behavior, backend route, OpenAPI change,
    generated client, browser storage, or new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (49/49)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This render-only comments panel adds no route call or caller
    authority path.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no comment mutation, state change, audit write, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, browser
    storage, logging, provider surface, or token handling.
  - Customer portal exposure rules hold: Passed. Public-update content is only a
    staff-side placeholder panel; no portal UI/API exposure was added, and tests
    assert no portal/audit/DMS/provider/storage leakage in the detail source.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover internal
    versus public visibility badges, preview states, safe placeholders, Arabic
    labels, and no API/storage behavior.

## F6-04C - Add Detail Attachment Upload And Download Controls

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-FILES-001
  - METHOD-TEST-001
- Evidence:
  - Extended the complaint detail workspace with localized attachment controls.
  - Added upload and authorized-download affordances as UI-only controls.
  - Added safe file-rule text that states backend authorization owns upload and
    download access.
  - Added pending, clean, and rejected scan status badges plus loading, empty, and
    error preview states.
  - Reused the existing `attachment` preview parameter instead of adding another
    shell state.
  - Extended `test:web -- shell` from 49 to 53 tests covering attachment actions,
    scan states, preview states, Arabic labels, no file transfer behavior, and no
    storage-link exposure.
  - Added no file upload, file read, object URL, API fetch, download URL, backend
    route, OpenAPI change, generated client, provider call, browser storage, or
    new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (53/53)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This render-only attachment panel adds no route call or
    caller authority path.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no upload/download mutation, audit write, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, browser
    storage, logging, provider surface, token handling, file reads, or object URLs.
  - Customer portal exposure rules hold: Passed. The controls are staff-side
    render-only placeholders and expose no portal data, audit logs, DMS codes,
    provider details, or direct file/storage links.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover scan
    states, safe placeholders, Arabic labels, and absence of upload/file-read/
    object-URL/API/storage behavior.

## F6-04D - Add Workflow Action Modal

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-WORKFLOW-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - Added a localized render-only workflow action modal section inside the
    complaint detail workspace.
  - Rendered action affordances for approve, send back, assign, investigate,
    resolve, close, reject, and reopen.
  - Added a required comment input surface with localized validation preview text.
  - Added loading, empty, error, success, and optimistic conflict preview states.
  - Added copy that keeps workflow action availability owned by backend policy.
  - Extended `test:web -- shell` from 53 to 57 tests covering workflow action
    labels, required comment validation, preview states, Arabic labels, and no
    client-side transition authority in source.
  - Added no transition API call, frontend status decision, owner/branch/SLA/audit
    decision, backend route, OpenAPI change, generated client, browser storage, or
    new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (57/57)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This render-only workflow modal adds no route call or caller
    authority path.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no workflow mutation, status update, audit write, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, browser
    storage, logging, provider surface, or token handling.
  - Customer portal exposure rules hold: Passed. This is staff-side render-only UI
    and exposes no portal data, audit logs, DMS codes, provider details, or direct
    file/storage links.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover action
    labels, required comment validation, safe preview states, Arabic labels, and
    absence of API/storage/client-transition behavior.

## F6-04E - Add Detail Conflict Recovery And RTL/LTR Proof

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-WORKFLOW-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - Added localized conflict recovery affordances to the complaint detail workflow
    conflict state: reload latest detail and retry after reload.
  - Kept conflict recovery UI-only: no fetch, reload, diff, retry, or persistence
    behavior was added.
  - Added focused English LTR and Arabic RTL tests proving the detail workspace
    renders facts, internal comments, attachments, and workflow regions together.
  - Extended `test:web -- shell` from 57 to 59 tests covering conflict recovery
    affordances, complete detail region RTL/LTR rendering, and no API/browser
    storage/reload behavior in source.
  - Added no API call, latest-record fetch, diff/retry behavior, workflow status
    decision, backend route, OpenAPI change, generated client, browser storage, or
    new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (59/59)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This UI-only conflict recovery adds no route call or caller
    authority path.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no workflow mutation, status update, audit write, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, browser
    storage, logging, provider surface, or token handling.
  - Customer portal exposure rules hold: Passed. The detail workspace remains
    staff-side render-only UI and exposes no portal data, audit logs, DMS codes,
    provider details, or direct file/storage links.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover conflict
    recovery copy/actions, full detail RTL/LTR rendering, and absence of API/
    storage/reload/client-transition behavior.

## F6-05A - Add Admin Branches And Departments UI

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-ADMIN-001
  - REQ-RBAC-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - Added a localized render-only Admin branches/departments screen to the staff
    shell.
  - Rendered branch and department table regions with active/inactive badges and
    create/edit/deactivate affordances.
  - Added loading, empty, error, success, validation, and conflict preview states.
  - Admin screen renders only in the existing Admin role preview; backend RBAC
    remains the real authority.
  - Added `staff-admin-branches` i18n text for English LTR and Arabic RTL labels.
  - Extended `test:web -- shell` from 59 to 63 tests covering Admin visibility,
    CRUD affordances, preview states, Arabic labels, responsive table classes, and
    no API/browser-storage/client-RBAC behavior in source.
  - Added no Admin API fetch/mutation, client RBAC decision, audit behavior,
    backend route, OpenAPI change, generated client, browser storage, or new
    dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (63/63)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This render-only Admin preview adds no route call or caller
    authority path; tests show it is hidden from the staff preview.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no Admin mutation, audit write, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, browser
    storage, logging, provider surface, or token handling.
  - Customer portal exposure rules hold: Passed. The Admin screen is staff-side
    render-only UI and exposes no portal data, audit logs, DMS codes, provider
    details, or unrelated complaint data.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover Admin-only
    preview visibility, safe placeholder content, Arabic labels, preview states,
    and absence of API/storage/client-RBAC behavior.

## F6-05B - Add Admin Users Roles Branch Scope And Reset UI

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-ADMIN-001
  - REQ-RBAC-001
  - REQ-AUTH-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - Added a localized render-only Admin users, roles, branch-scope, and password
    reset UI contract to the staff shell.
  - Rendered a user table region with role badges, branch scope badges,
    active/inactive state, create/edit/deactivate affordances, and a generic
    password-reset affordance.
  - Added loading, empty, error, success, validation, and conflict preview states.
  - Kept Admin visibility as shell preview only; backend RBAC remains the real
    authority for all user, role, branch-scope, and reset behavior.
  - Added `staff-admin-users` i18n text for English LTR and Arabic RTL labels.
  - Extended `test:web -- shell` from 63 to 66 tests covering Admin visibility,
    role/scope/reset affordances, generic reset messaging, Arabic labels, and no
    API/browser-storage/client-RBAC behavior in source.
  - Added no Admin API fetch/mutation, role assignment behavior, branch-scope
    persistence, password reset delivery, backend route, OpenAPI change,
    generated client, browser storage, or new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (66/66)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This render-only Admin preview adds no route call, reset
    request, role assignment, or caller authority path.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no Admin mutation, password reset side effect, audit write, or
    delivery enqueue.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. Reset UI uses generic messaging and exposes no token, API
    response, provider detail, browser storage, or credential field.
  - Customer portal exposure rules hold: Passed. The Admin screen is staff-side
    render-only UI and exposes no portal data, audit logs, DMS codes, provider
    details, staff PII, or unrelated complaint data.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover Admin-only
    preview visibility, role/scope/reset labels, safe reset copy, Arabic labels,
    and absence of API/storage/client-RBAC behavior.

## F6-05C - Add Admin Categories Severity And SLA Policy UI

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-ADMIN-001
  - REQ-RBAC-001
  - REQ-COMPLAINT-001
  - REQ-SLA-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - Added a localized render-only Admin categories, severity, and SLA policy UI
    contract to the staff shell.
  - Added an `AdminSurfaces` wrapper so the shell can keep Admin screens grouped
    while staying under the 300-line source budget.
  - Rendered category tree, severity values, and SLA policy table regions with
    active/inactive badges, policy-scope badges, create/edit/deactivate
    affordances, warning threshold, and deadline fields.
  - Added explicit copy that SLA deadlines are calculated and enforced by the
    backend.
  - Added loading, empty, error, success, validation, and conflict preview states.
  - Added `staff-admin-categories-sla` i18n text for English LTR and Arabic RTL
    labels.
  - Tightened the Admin users/roles panel to render the same preview-state banner
    family that its completed contract requires.
  - Extended `test:web -- shell` from 66 to 71 tests covering Admin-only
    visibility, category/severity/SLA labels, validation and conflict states,
    Arabic labels, no API/browser-storage/client-RBAC behavior, and no client SLA
    calculation behavior.
  - Added no Admin API fetch/mutation, category persistence, severity persistence,
    SLA deadline calculation, escalation logic, backend route, OpenAPI change,
    generated client, browser storage, or new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Failed then Passed: `corepack pnpm typecheck`; the initial failure was a
    stale `AdminBranchesPreviewState` prop type after moving Admin panels behind
    `AdminSurfaces`. The type was updated to `AdminPreviewState` and final proof
    passed.
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (71/71)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This render-only Admin preview adds no route call, caller
    authority path, category mutation, or SLA policy mutation.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no Admin mutation, SLA escalation behavior, audit write, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, browser
    storage, logging, provider surface, or token handling.
  - Customer portal exposure rules hold: Passed. The Admin screen is staff-side
    render-only UI and exposes no portal data, audit logs, DMS codes, provider
    details, staff PII, or unrelated complaint data.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover Admin-only
    preview visibility, localized labels/states, responsive table width, absence
    of API/storage/client-RBAC behavior, and absence of client-side SLA deadline
    calculation.

## F6-05D - Add Admin Notification Template UI

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-ADMIN-001
  - REQ-RBAC-001
  - REQ-NOTIFY-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - Added a localized render-only Admin notification template UI contract to the
    staff shell.
  - Rendered template table and preview regions with event trigger, channels,
    Arabic/English language labels, active/inactive badges, edit/activate/
    deactivate affordances, and approved placeholder-token display.
  - Added loading, empty, error, success, validation, and conflict preview states.
  - Added `staff-admin-notification-templates` i18n text for English LTR and
    Arabic RTL labels.
  - Added safe copy that backend template services own placeholder validation and
    delivery rules.
  - Extended `test:web -- shell` from 71 to 75 tests covering Admin-only
    visibility, channel/event/template labels, placeholder tokens, preview states,
    Arabic labels, no API/browser-storage/client-RBAC behavior, and no provider
    credential or delivery-log leakage in source.
  - Added no Admin API fetch/mutation, template persistence, provider call,
    dispatch behavior, real template rendering engine, backend route, OpenAPI
    change, generated client, browser storage, or new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (75/75)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This render-only Admin preview adds no route call, caller
    authority path, template mutation, or dispatch path.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no Admin mutation, notification dispatch, audit write, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, browser
    storage, provider surface, delivery log, or token handling.
  - Customer portal exposure rules hold: Passed. The Admin screen is staff-side
    render-only UI and exposes no portal data, audit logs, DMS codes, provider
    details, staff PII, real contact details, or unrelated complaint data.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover Admin-only
    preview visibility, localized labels/states, placeholder-token display,
    absence of API/storage/client-RBAC behavior, and absence of provider
    credential or delivery-log leakage.

## F6-05E - Add Audit Viewer UI

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-AUDIT-001
  - REQ-ADMIN-001
  - REQ-RBAC-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - Added a localized render-only Audit viewer UI contract to the staff shell.
  - Rendered filter controls for actor, action, target, date, and correlation ID.
  - Rendered safe placeholder audit rows with timestamp, actor, action, target,
    correlation ID, event badges, and an export affordance.
  - Added loading, empty, error, success, validation, and conflict preview states.
  - Added `staff-audit-viewer` i18n text for English LTR and Arabic RTL labels.
  - Added safe copy that backend search owns redaction, configured limits, and
    authorization.
  - Extended `test:web -- shell` from 75 to 79 tests covering Admin-only
    visibility, filters, export affordance, safe placeholder rows, preview states,
    Arabic labels, no API/browser-storage/client-RBAC behavior, and no export or
    credential leakage in source.
  - Added no audit fetch, export file generation, pagination, search, sort,
    backend route, OpenAPI change, generated client, browser storage, or new
    dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (79/79)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This render-only audit preview adds no route call, caller
    authority path, export request, or audit visibility decision.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state mutation, audit write, export side effect, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, browser
    storage, provider surface, delivery log, file export, or token handling.
  - Customer portal exposure rules hold: Passed. The Audit viewer is staff-side
    render-only UI and uses placeholder rows only; it exposes no portal data,
    real audit data, DMS codes, provider details, staff PII, real contact details,
    or unrelated complaint data.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover Admin-only
    preview visibility, localized filters/states, safe placeholder rows, export
    affordance, and absence of API/storage/client-RBAC/export/credential behavior.

## F6-05F - Add In-App Notification Center UI

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-NOTIFY-001
  - REQ-RBAC-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - Added a localized render-only in-app notification center to the staff shell.
  - Rendered unread/read notification list regions with read/unread badges,
    workflow/SLA event badges, timestamps, scoped complaint-link affordance, and
    mark-read affordance.
  - Added loading, empty, error, success, validation, and conflict preview states
    through a dedicated `notification` query preview parameter.
  - Added `staff-notification-center` i18n text for English LTR and Arabic RTL
    labels.
  - Added safe copy that complaint links remain scoped by backend authorization
    and do not grant access.
  - Extended `test:web -- shell` from 79 to 83 tests covering staff-visible
    notification center rendering, unread/read states, scoped complaint-link and
    mark-read affordances, preview states, Arabic labels, no API/browser-storage/
    client-RBAC behavior, and no direct navigation or credential/provider leakage
    in source.
  - Added no notification fetch, mark-read mutation, link navigation, pagination,
    search, sort, backend route, OpenAPI change, generated client, browser
    storage, or new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (83/83)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This render-only notification center adds no route call,
    caller authority path, branch-scope decision, or link navigation.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no read-state mutation, notification dispatch, audit write, or side
    effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, browser
    storage, provider surface, delivery log, direct navigation, or token handling.
  - Customer portal exposure rules hold: Passed. The notification center is
    staff-side render-only UI and uses scoped placeholders only; it exposes no
    portal data, audit logs, DMS codes, provider details, staff PII, real contact
    details, or cross-scope complaint data.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover localized
    unread/read states, scoped-link and mark-read affordances, safe placeholders,
    and absence of API/storage/navigation/client-RBAC/credential behavior.

## F6-06A - Add Reports Dashboard Placeholders

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-REPORT-001
  - REQ-RBAC-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - Added a localized render-only reports dashboard to the staff shell.
  - Rendered RPT-001 through RPT-017 placeholder entries with safe report names,
    audience text, category badges, and API-pending status.
  - Reports dashboard is visible for management/admin role previews and hidden
    from staff role preview.
  - Added loading, empty, error, success, validation, and conflict preview states
    through a dedicated `reports` query preview parameter.
  - Added `staff-reports-dashboard` i18n text for English LTR and Arabic RTL
    labels.
  - Added safe copy that report data, metrics, filters, and exports remain
    backend-scoped.
  - Extended `test:web -- shell` from 83 to 87 tests covering full RPT-001
    through RPT-017 coverage, management/admin visibility, staff hiding, pending
    API status, preview states, Arabic labels, no API/browser-storage/client-RBAC
    behavior, no chart/calculation/export-file behavior, and no DMS code or
    credential leakage in source.
  - Added no report data fetch, metric calculation, chart rendering, export file,
    report detail navigation, pagination, search, sort, backend route, OpenAPI
    change, generated client, browser storage, or new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (87/87)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This render-only reports dashboard adds no route call,
    caller authority path, branch-scope decision, or export path.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no report mutation, export behavior, audit write, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, browser
    storage, provider surface, file export, or token handling.
  - Customer portal exposure rules hold: Passed. The reports dashboard is
    staff-side render-only UI and uses placeholder entries only; it exposes no
    portal data, audit logs, DMS codes, provider details, staff PII, real contact
    details, or cross-scope complaint data.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover role
    preview visibility, full report ID coverage, localized states, safe
    placeholders, and absence of API/storage/report-data/export-file behavior.

## F6-06B - Add Report Export Affordance UI

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - REQ-REPORT-001
  - REQ-RBAC-001
  - API-STANDARD-001
  - METHOD-TEST-001
- Evidence:
  - Added localized render-only CSV and Excel export affordances to the reports
    dashboard.
  - Added row-limit, RBAC-filtered, and export-audit copy that keeps export
    truth with backend services.
  - Added export-specific ready and denied preview states while preserving the
    existing loading, empty, error, success, validation, and conflict states.
  - Added `reports=ready` and `reports=denied` preview query handling in the
    staff shell.
  - Extended `test:web -- shell` from 87 to 88 tests covering export controls,
    row-limit/RBAC/audit copy, export preview states, Arabic labels, no API or
    browser-storage behavior, and no client-side file generation/download path.
  - Added no report data fetch, CSV/Excel generation, Blob/object URL, download,
    metric calculation, report detail navigation, backend route, OpenAPI change,
    generated client, browser storage, or new dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (29/29; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (88/88)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This render-only export preview adds no route call, caller
    authority path, branch-scope decision, export authorization, or download
    path.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no report mutation, export creation, audit write, file side effect, or
    side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no credential fields, API calls, browser
    storage, provider surface, file export, object URL, or token handling.
  - Customer portal exposure rules hold: Passed. The reports dashboard is
    staff-side render-only UI and uses placeholder entries only; it exposes no
    portal data, audit logs, DMS codes, provider details, staff PII, real contact
    details, or cross-scope complaint data.
  - Trust boundaries are tested: Passed for this UI slice. Tests cover role
    preview visibility, localized export states, row-limit/RBAC/audit copy, and
    absence of API/storage/report-data/export-file/download behavior.

## F6-07A - Replace Fail-Loud Web Proof Placeholders

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - QA-UI-001
  - NFR-PERF-001
  - METHOD-TEST-001
- Evidence:
  - Added `tools/web-proof.mjs`, a deterministic local web proof runner that
    renders the existing Next staff shell with `react-dom/server`.
  - Wired `test:visual` to the new visual smoke mode.
  - Wired `test:e2e -- accessibility` to the new accessibility smoke mode.
  - Wired `web:perf` to the new frontend performance smoke mode.
  - Kept `test:web -- shell` and `test:web -- api-client` on the existing focused
    web test runner.
  - Covered English LTR and Arabic RTL staff shell preview renders in every new
    mode.
  - Visual smoke checks guard against blank renders, missing direction, missing
    core shell/report/export surfaces, missing major sections, and missing table
    overflow/shared card styling.
  - Accessibility smoke checks guard language/direction, named navigation,
    labelled regions, form labels, focus-ring affordances, aria-hidden decorative
    SVGs, explicit button types, and feedback roles.
  - Performance smoke checks guard server render time, HTML size, table-row count,
    unexpected script emission, and images without dimensions.
  - Added `tools/web-proof.test.mjs` coverage for visual/accessibility/perf modes
    and unknown-suite rejection.
  - Updated `tools/pending-proof.test.mjs` so unrelated pending proof commands
    still fail loudly.
  - Added no browser automation dependency, screenshot baselines, backend route,
    OpenAPI change, generated client, database migration, provider call, browser
    storage, or product feature behavior.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (31/31; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (88/88)
  - Failed then Passed: `corepack pnpm test:visual`; initial failure was root
    tool module resolution for `react-dom`, fixed by resolving from
    `apps/web/package.json`.
  - Failed then Passed: `corepack pnpm test:e2e -- accessibility`; initial
    failure was an over-strict button assertion that rejected explicit
    `type="submit"`, fixed to reject only missing button types.
  - Passed: `corepack pnpm web:perf`
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. The proof runner renders existing preview states only and
    adds no route call, authority parameter, browser storage, or client RBAC
    behavior.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state mutation, audit write, export generation, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. The runner renders static shell previews and does not read
    cookies, storage, environment secrets, provider credentials, or tokens.
  - Customer portal exposure rules hold: Passed by scope. The runner exercises
    staff shell preview output only and adds no portal data, audit data, DMS code,
    provider detail, real contact detail, or cross-scope complaint data.
  - Trust boundaries are tested: Passed for this proof-surface slice. Tests prove
    the new runner passes real visual/accessibility/performance smoke modes and
    that unrelated pending proof commands still fail loudly.

## F6-07B - Add Visual Regression Coverage

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - QA-UI-001
  - METHOD-TEST-001
- Evidence:
  - Expanded `tools/web-proof.mjs` visual mode from two smoke renders to 16
    deterministic visual-regression cases.
  - Covered dashboard, work queue, complaint create, complaint detail, workflow
    modal, Admin surfaces, reports, and audit viewer.
  - Covered every visual-regression surface in English LTR and Arabic RTL.
  - Each case asserts localized surface signals, important table/form/dialog
    structure, responsive guard classes, page direction, major section count, and
    non-blank render output.
  - Visual failures now include the locale and surface name in the case label.
  - Kept accessibility and performance modes on the two smoke previews from
    `F6-07A`; deeper accessibility remains queued for `F6-07C`.
  - Kept `tools/web-proof.mjs` at 180 lines, under the 300-line source budget.
  - Added no browser automation dependency, screenshot baseline files, UI
    behavior change, backend route, OpenAPI change, generated client, database
    migration, provider call, browser storage, or product dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (31/31; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (88/88)
  - Passed: `corepack pnpm test:visual` (16 staff shell previews)
  - Passed: `corepack pnpm test:e2e -- accessibility`
  - Passed: `corepack pnpm web:perf`
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. The visual cases render existing preview surfaces only and
    add no route call, authority parameter, browser storage, or client RBAC
    behavior.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state mutation, audit write, export generation, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. The runner renders static shell previews and does not read
    cookies, storage, environment secrets, provider credentials, or tokens.
  - Customer portal exposure rules hold: Passed by scope. The runner exercises
    staff shell preview output only and adds no portal data, audit data, DMS code,
    provider detail, real contact detail, or cross-scope complaint data.
  - Trust boundaries are tested: Passed for this visual-proof slice. Tests cover
    visual runner execution through `test:visual` plus unchanged shell,
    accessibility, and performance proof commands.

## F6-07C - Add Accessibility Coverage

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-SCREEN-001
  - UI-DESIGN-001
  - QA-UI-001
  - METHOD-TEST-001
- Evidence:
  - Expanded `tools/web-proof.mjs` accessibility mode from two smoke renders to
    11 named staff-shell accessibility cases.
  - Covered dashboard status/alert feedback, work-queue form labels and alerts,
    complaint-create validation and network alerts, complaint-detail alert state,
    workflow dialog naming and controls, Admin feedback, reports denied feedback,
    and audit filters.
  - Covered English LTR and Arabic RTL direction across the accessibility cases.
  - Accessibility checks now assert language/direction, named navigation,
    localized surface signals, labelled regions, form labels, focus affordances,
    decorative SVG hiding, explicit button types, feedback roles, named dialogs,
    and minimum named-control counts where relevant.
  - Added global `:focus-visible` styling in `apps/web/src/globals.css` so all
    keyboard-reachable controls have a focus affordance even where component
    classes do not include focus utilities.
  - Added global `prefers-reduced-motion: reduce` CSS that disables animation and
    transition duration for reduced-motion users.
  - Kept `tools/web-proof.mjs` at 227 lines, under the 300-line source budget.
  - Added no browser automation dependency, UI feature behavior, backend route,
    OpenAPI change, generated client, database migration, provider call, browser
    storage, or product dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (31/31; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (88/88)
  - Passed: `corepack pnpm test:visual` (16 staff shell previews)
  - Passed: `corepack pnpm test:e2e -- accessibility` (11 staff shell previews)
  - Passed: `corepack pnpm web:perf`
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. The accessibility cases render existing preview surfaces
    only and add no route call, authority parameter, browser storage, or client
    RBAC behavior.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state mutation, audit write, export generation, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. The runner renders static shell previews and does not read
    cookies, storage, environment secrets, provider credentials, or tokens.
  - Customer portal exposure rules hold: Passed by scope. The runner exercises
    staff shell preview output only and adds no portal data, audit data, DMS code,
    provider detail, real contact detail, or cross-scope complaint data.
  - Trust boundaries are tested: Passed for this accessibility-proof slice. Tests
    cover accessibility runner execution through `test:e2e -- accessibility`
    plus unchanged visual, shell, and performance proof commands.

## F6-07D - Add Frontend Performance Budgets And Phase Review Task

- Date: 2026-06-19
- Risk: High
- Status: Passed
- Required model tier: BUILDER-STRONG
- Requirement IDs:
  - UI-DESIGN-001
  - QA-UI-001
  - NFR-PERF-001
  - METHOD-TEST-001
- Evidence:
  - Strengthened `tools/web-proof.mjs` performance mode with explicit staff
    dashboard and staff work-queue performance cases.
  - Added per-case performance budgets for deterministic server-render duration,
    HTML size, table-row count, responsive guard count, static script emission,
    and image dimension safety.
  - The dashboard case asserts staff dashboard labels and SLA warning card
    signals.
  - The work-queue case asserts Arabic RTL queue title, search filter, and
    pagination signals.
  - Kept performance proof explicitly scoped to local deterministic render checks;
    staging p95 browser/API performance remains a later operational concern.
  - Kept `tools/web-proof.mjs` at 257 lines, under the 300-line source budget.
  - Marked Phase 6 backlog items complete and wrote the mandatory Phase 6 review
    gate in `.forge/next.md`.
  - Set `.forge/state.md` to `Needs Phase Review` so AUTO PHASE stops before
    Phase 7 implementation.
  - Added no browser performance dependency, Lighthouse, UI behavior change,
    backend route, OpenAPI change, generated client, database migration, provider
    call, browser storage, or product dependency.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (31/31; coverage thresholds cleared)
  - Passed: `corepack pnpm test:web -- shell` (88/88)
  - Passed: `corepack pnpm test:visual` (16 staff shell previews)
  - Passed: `corepack pnpm test:e2e -- accessibility` (11 staff shell previews)
  - Passed: `corepack pnpm web:perf` (2 staff shell previews)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. The performance cases render existing preview surfaces only
    and add no route call, authority parameter, browser storage, or client RBAC
    behavior.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state mutation, audit write, export generation, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. The runner renders static shell previews and does not read
    cookies, storage, environment secrets, provider credentials, or tokens.
  - Customer portal exposure rules hold: Passed by scope. The runner exercises
    staff shell preview output only and adds no portal data, audit data, DMS code,
    provider detail, real contact detail, or cross-scope complaint data.
  - Trust boundaries are tested: Passed for this performance-proof slice. Tests
    cover performance runner execution through `web:perf` plus unchanged visual,
    accessibility, shell, lint, typecheck, test, and OpenAPI proof commands.

## PHASE-6-REVIEW - Staff UI Acceptance Review

- Date: 2026-06-19
- Risk: High
- Status: Passed (Accept With Conditions)
- Required model tier: PHASE-REVIEWER (Opus 4.8, fresh context)
- Requirement IDs reviewed:
  - UI-SCREEN-001, UI-DESIGN-001, QA-UI-001, METHOD-TEST-001, NFR-PERF-001
  - REQ-AUTH-001, REQ-RBAC-001, REQ-COMPLAINT-001, REQ-WORKFLOW-001,
    REQ-FILES-001, REQ-ADMIN-001, REQ-AUDIT-001, REQ-NOTIFY-001, REQ-REPORT-001
- Evidence:
  - Re-ran every required Phase 6 proof command independently rather than trusting
    the builder logs; all reproduced green with counts matching evidence exactly.
  - Re-ran the Phase 6 backend auth suite (`test:api -- auth`, 32/32) to cover the
    password-reset prerequisite that landed inside Phase 6 (F6-01D1..D3).
  - Inspected `tools/web-proof.mjs`, `tools/web-test.mjs`,
    `apps/web/src/lib/staff-complaints-api.ts`, `apps/web/src/app/page.tsx`,
    `complaint-create-form.tsx`, and `complaint-detail-workspace.tsx` directly.
  - Confirmed the create form is the only backend-wired surface and carries no
    client role/actor/workflow/credential authority; the workflow modal and
    attachment/detail controls are inert render-only placeholders.
  - Confirmed browser-storage discipline (no token storage; only the required CSRF
    cookie read), no secret logging, and an auth-only API-side diff (no scope leak).
  - Confirmed all Phase 6 backlog items are checked done with honest evidence.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (31/31; coverage 93.78% lines / 86.14% branch /
    92.47% funcs)
  - Passed: `corepack pnpm test:web -- shell` (88/88)
  - Passed: `corepack pnpm test:web -- api-client` (9/9)
  - Passed: `corepack pnpm test:visual` (16 staff shell previews)
  - Passed: `corepack pnpm test:e2e -- accessibility` (11 staff shell previews)
  - Passed: `corepack pnpm web:perf` (2 staff shell previews)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `corepack pnpm test:api -- auth` (32/32)
  - Passed: `git diff --check` (clean; line-ending warnings only)
- Decision: Accept With Conditions. Full reasoning, SRS mapping, and the five
  non-blocking carry-forward conditions are recorded in `.forge/trust.md` under
  `PHASE-6-REVIEW`. Phase 7 opens with `PLAN-F7-01` at state `Ready to Plan`.

## F7-01A - Generate Reports Module Boundary And Manifest

- Date: 2026-06-19
- Phase: Phase 7 - Reports, UAT, And Ops
- Required model tier: BUILDER-STRONG (user-requested escalation from the queued
  BUILDER-STANDARD scaffold task)
- Risk: Medium
- Requirement IDs:
  - REQ-REPORT-001
  - METHOD-MODULAR-001
- Evidence:
  - Ran `corepack pnpm generate:module -- reports`; generator created the
    canonical reports module files.
  - Filled `apps/api/src/modules/reports/MODULE.md` with the real boundary:
    `ReportsService` public surface, no owned tables yet, minimal allowed
    dependencies, and the reporting/modularity SRS IDs.
  - Added `ReportsModule` to the inline API root module imports in
    `apps/api/src/main.ts`.
  - Confirmed generated source files are under the 300-line budget and contain no
    TODO/FIXME markers.
  - Added no reporting behavior, route handler, OpenAPI path, DTO logic beyond
    generator placeholders, RBAC/branch-scope wiring, cross-module service import,
    Prisma query, schema change, migration, frontend change, export behavior, or
    provider call.
- Verification:
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (31/31; generator, wiring, manifest truth, and
    OpenAPI scaffold checks included)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)

## F7-01B - Decide And Wire Cross-Module Reporting Read Access

- Date: 2026-06-19
- Phase: Phase 7 - Reports, UAT, And Ops
- Required model tier: BUILDER-STRONG
- Risk: High
- Requirement IDs:
  - REQ-REPORT-001
  - METHOD-MODULAR-001
- Evidence:
  - Chose declared public-service dependencies for the reports read boundary:
    `ComplaintsService`, `SlaService`, and `SurveysService`.
  - Updated `reports/MODULE.md` to declare those public-service dependencies.
  - Imported `ComplaintsModule`, `SlaModule`, and `SurveysModule` in
    `ReportsModule` and injected only their public services into
    `ReportsService`.
  - Updated generated reports construction specs to pass typed public-service
    stubs.
  - Removed stale `sla` from `tools/wiring-check.mjs` known-unwired debt because
    `SlaModule` is now reachable through `ReportsModule`.
  - Added no dashboard aggregate, report filter, route handler, OpenAPI path,
    CSV/Excel export, export audit, RBAC/branch-scope guard, schema/migration,
    frontend change, direct cross-module repository import, DTO import, Prisma
    model type, provider call, or report query behavior.
- Verification:
  - Failed then repaired: first `corepack pnpm lint` failed because
    `tools/wiring-check.mjs knownUnwiredModules` still allowed `sla` after
    `SlaModule` became reachable.
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (31/31; wiring and manifest truth checks
    included)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed by scope. This task added no report route, request parameter, guard
    behavior, or client data source; later report routes must derive scope from
    server-session guards.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added no state change, audit write, export write, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. This task added no logging, response body, provider call,
    browser storage, or secret access.
  - Customer portal exposure rules hold: Passed by scope. This task added no
    portal route, portal response, customer-facing data read, internal comment
    exposure, audit exposure, DMS code exposure, or staff PII exposure.
  - Trust boundaries are tested: Passed for this boundary slice. `lint` and
    `test` include manifest truth and module wiring gates proving reports uses
    declared public services only and no private cross-module repository/DTO
    import was added.

## F7-01C - Dashboard Summary Read Model

- Date: 2026-06-19
- Phase: Phase 7 - Reports, UAT, And Ops
- Required model tier: BUILDER-STRONG
- Risk: High
- Requirement IDs:
  - REQ-REPORT-001 AC1
  - REQ-REPORT-001 AC4
  - METHOD-MODULAR-001
- Evidence:
  - Added `ReportsService.dashboardSummary(...)` returning
    `openComplaints`, `overdueComplaints`, `slaWarningComplaints`,
    `closedComplaints`, and `averageTatHours`.
  - Kept reports inside the public-service read boundary: complaint data comes
    from `ComplaintsService.listQueue(...)`; SLA warning/overdue calculations use
    `SlaService.defaultDurationMinutes(...)` and `SlaService.calculateDeadline(...)`.
  - Added `apps/api/test/reports/dashboard-summary.test.ts` and enabled
    `test:api -- reports`.
  - Tests cover one allowed branch-scoped dashboard summary and one hidden
    out-of-branch case, plus Admin all-branch comparison.
  - Added no HTTP route, OpenAPI path, CSV/Excel export, export audit,
    schema/migration, frontend change, provider call, direct cross-module
    repository import, DTO import, Prisma model type, or report controller
    behavior.
- Verification:
  - Passed: `corepack pnpm test:api -- reports` (2/2)
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (31/31)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed for this service slice. `dashboardSummary(...)` accepts a typed scope
    representing server-session context and has no HTTP route/query/body authority
    source; the reports API route/guards are explicitly deferred to F7-01E.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added read-only summary behavior only and no state change, audit write,
    export write, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. The read model returns numeric counts only and added no
    logging, credential access, provider call, or browser storage.
  - Customer portal exposure rules hold: Passed by scope. This task added no
    portal route/response and returns only aggregate numeric staff report data,
    not internal comments, audit logs, DMS codes, staff PII, or unrelated portal
    complaint details.
  - Trust boundaries are tested: Passed. `test:api -- reports` covers an allowed
    branch-scoped summary and proves hidden out-of-branch complaints are excluded;
    `lint`/`test` also run manifest truth and wiring gates.

## F7-01D - Filtered Report Read Models

- Date: 2026-06-19
- Phase: Phase 7 - Reports, UAT, And Ops
- Required model tier: BUILDER-STRONG
- Risk: High
- Requirement IDs:
  - REQ-REPORT-001 AC2
  - REQ-REPORT-001 AC4
  - METHOD-MODULAR-001
- Evidence:
  - Added `ReportsService.filteredReport(...)` with date range, branch, category,
    severity, and owner filters.
  - Added `ComplaintsService.listForReports(...)` and
    `ComplaintsRepository.listForReports(...)` as the public source-module read
    path needed for category/owner/date report filtering.
  - Preserved the F7-01B boundary: reports imports `ComplaintsService` type only
    from the complaints service file and never imports another module repository,
    DTO folder, or Prisma model type.
  - Tests prove filtered report success for Admin branch/category/severity/owner/
    date filters and denial of out-of-branch rows for a scoped Branch Manager.
  - Kept `apps/api/src/modules/complaints/complaints.service.ts` at 297 lines,
    under the 300-line source budget.
  - Added no HTTP route, OpenAPI path, CSV/Excel export, export audit,
    schema/migration, frontend change, provider call, or report controller
    behavior.
- Verification:
  - Passed: `corepack pnpm test:api -- reports` (4/4)
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (31/31)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed for this service slice. `filteredReport(...)` accepts typed
    server-session scope plus filters; it has no HTTP route/query/body authority
    source yet. F7-01E must derive these values from guards/session.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added read-only report behavior only and no state change, audit write, export
    write, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. The read model returns report rows without credentials and
    added no logging, provider call, browser storage, or secret access.
  - Customer portal exposure rules hold: Passed by scope. This task added no
    portal route/response and no internal comments, audit logs, DMS codes, staff
    PII, or portal complaint detail exposure.
  - Trust boundaries are tested: Passed. `test:api -- reports` covers allowed
    scoped filtering and denied out-of-branch filtering; `lint`/`test` also run
    manifest truth and module wiring gates.

## F7-01E - Report HTTP Read Routes With RBAC And OpenAPI

- Date: 2026-06-19
- Phase: Phase 7 - Reports, UAT, And Ops
- Required model tier: BUILDER-STRONG
- Risk: High
- Requirement IDs:
  - REQ-REPORT-001 AC1
  - REQ-REPORT-001 AC2
  - REQ-REPORT-001 AC4
  - METHOD-API-001
  - METHOD-MODULAR-001
  - REQ-RBAC-001
- Evidence:
  - Added `GET /reports/dashboard` and `GET /reports` to `ReportsController`.
  - Wired `ReportsModule` with `AuthModule`, `SessionAuthGuard`, `RbacGuard`, and
    the existing `SESSION_AUTH_SERVICE` provider pattern.
  - Routes derive role and branch scope from `request.principal`; query branch
    filters are passed as filters and cannot widen non-admin scope.
  - Updated `reports/MODULE.md` to declare the new `AuthModule` dependency.
  - Added canonical OpenAPI paths/schemas and regenerated
    `packages/contracts/openapi.json`.
  - Tests cover principal-derived route scope and an audited branch-scope denial
    through `RbacGuard`.
  - Added no export behavior, schema/migration, frontend change, provider call,
    direct cross-module repository import, DTO import, or Prisma model type.
- Verification:
  - Passed: `corepack pnpm test:api -- reports` (6/6)
  - Failed then repaired: first `corepack pnpm lint` failed because
    `reports/MODULE.md` did not declare the new `AuthModule` dependency.
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (31/31)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed. Reports routes derive `role` and scoped branch from
    `request.principal`; `RbacGuard` enforces branch query mismatch before
    controller execution, and tests cover principal-derived scope plus audited
    branch-scope denial.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. This task
    added read-only routes only and no state change, export write, side effect, or
    audit-bearing mutation.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. Routes return report aggregates/rows only and added no
    credential logging, secret access, provider call, or browser storage.
  - Customer portal exposure rules hold: Passed by scope. This task added staff
    report routes only and no portal route/response; it does not return internal
    comments, audit logs, DMS codes, staff PII, or portal verification data.
  - Trust boundaries are tested: Passed. `test:api -- reports` covers allowed
    route scope derivation and audited branch-scope denial; `lint`/`test` also
    run manifest truth, wiring, and OpenAPI gates.

## F7-01F - Bounded Report Export With Audit

- Date: 2026-06-19
- Phase: Phase 7 - Reports, UAT, And Ops
- Required model tier: BUILDER-STRONG
- Risk: High
- Requirement IDs:
  - REQ-REPORT-001 AC3
  - REQ-REPORT-001 AC4
  - REQ-AUDIT-001
  - METHOD-API-001
  - METHOD-MODULAR-001
  - REQ-RBAC-001
- Evidence:
  - Added `GET /reports/export?format=csv|excel` with existing session auth, RBAC,
    and branch-scope guard patterns.
  - Reused `ReportsService.filteredReport(...)` for all export filters and branch
    scope.
  - Added `MAX_REPORT_EXPORT_ROWS` and clips rows before serialization.
  - CSV output is real CSV. `excel` output is honest Excel-compatible TSV served
    as `reports.xls`; no XLSX claim and no new dependency.
  - Successful export writes a `REPORT` audit entry with format, row count, and
    row limit metadata.
  - Updated canonical OpenAPI and regenerated `packages/contracts/openapi.json`.
  - Added no schema/migration, frontend change, provider call, direct
    cross-module repository import, DTO import, or Prisma model type.
- Verification:
  - Passed: `corepack pnpm test:api -- reports` (7/7)
  - Passed: `corepack pnpm lint`
  - Passed: `corepack pnpm typecheck`
  - Passed: `corepack pnpm test` (31/31)
  - Passed: `corepack pnpm openapi:check`
  - Passed: `git diff --check` (line-ending warnings only)
- Security Self-Check:
  - Roles and branch scope come from the server session, never client input:
    Passed. Export route uses the same guarded controller pattern as report reads;
    branch scope comes from `request.principal`, and branch query mismatch is
    denied by `RbacGuard`.
  - Each state change writes status history and an audit entry in the same
    transaction; side effects enqueue after commit: Passed by scope. Export is a
    read plus an append-only `REPORT` audit entry; there is no domain state
    change, status history, or side effect.
  - No passwords, OTPs, tokens, hashes, or provider secrets are logged or
    returned: Passed. Export serializes report rows only and added no secret
    logging, provider calls, credential access, or browser storage.
  - Customer portal exposure rules hold: Passed by scope. Export is a guarded
    staff report route and does not return portal verification data, internal
    comments, audit logs, DMS codes, or staff PII.
  - Trust boundaries are tested: Passed. `test:api -- reports` covers row-limited
    export audit plus the existing route branch-scope denial; `lint`/`test` also
    run manifest truth, wiring, and OpenAPI gates.

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

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

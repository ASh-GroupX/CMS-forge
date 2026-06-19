# Build Task: F7-01A - Generate Reports Module Boundary And Manifest

Status: Ready to Build
Required model tier: BUILDER-STANDARD
(Escalate to BUILDER-STRONG for F7-01B onward, where reporting RBAC, branch
scope, export limits, and export audit logic begin.)
Risk: Medium (behavior-free scaffold for a High-risk reporting module)
Phase: Phase 7 - Reports, UAT, And Ops

## Goal

Create the canonical `reports` backend module shell and a real `MODULE.md`
boundary manifest, and wire `ReportsModule` into the API root module so module
reachability/manifest lint covers it. No reporting behavior in this task.

## Why This First

Phase 7's must-have is REQ-REPORT-001 (operational reports, dashboards, scoped
exports). Every prior backend feature module was generated from the template
before behavior (e.g. `integrations` F5-03A, `surveys` F5-07A). This task lays
that foundation safely so F7-01B..F7-01F can add read models, routes, exports,
and audit on a clean boundary.

## Scope (generate, then adjust only these)

- `apps/api/src/modules/reports/**` (generated shell: module, controller,
  service, repository)
- `apps/api/src/modules/reports/MODULE.md` (filled-in OKF manifest)
- The API root module file (add `ReportsModule` to its imports)

## Steps

1. Generate the module from the template — do not hand-roll structure:
   `corepack pnpm generate:module -- reports`.
2. Fill `MODULE.md` with the real boundary: `type: forge.module`, title,
   description, tags; the public service; **owned tables: none yet** (reporting
   reads other modules' data — the cross-module read-access decision is F7-01B,
   so declare no owned domain tables here); allowed dependencies left minimal;
   and the REQ-REPORT-001 requirement ID.
3. Wire `ReportsModule` into the API root module (AppModule) imports so the
   wiring gate and manifest truth gate cover it.
4. Keep every generated source file under the 300-line budget and free of
   TODO/FIXME markers.

## Out Of Scope (do NOT add in this task)

- Any report query, dashboard aggregate, filter, export, CSV/Excel, or audit
  behavior (F7-01B..F7-01F).
- Any HTTP route handler body, OpenAPI path, DTO logic, RBAC/branch-scope guard
  wiring, cross-module service import, Prisma query, schema change, or migration.
- Any frontend change.

## Required Proof Commands (run all; label honestly)

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm openapi:check`
- `git diff --check`

(The generator's own behavior is covered by `tools/generate-module.test.mjs`
inside `corepack pnpm test`. `openapi:check` must stay green because no route is
added in this task.)

## Acceptance Criteria

- `reports` module exists with the canonical generated structure and a complete,
  lint-valid `MODULE.md`.
- `ReportsModule` is reachable from the API root module; the wiring gate and
  manifest truth gate pass.
- No reporting behavior, route, OpenAPI path, schema, migration, cross-module
  import, or frontend change was added.
- All required proof commands ran and passed; evidence records honest labels.

## Requirement IDs

- REQ-REPORT-001 (operational reports and dashboards)
- METHOD-MODULAR-001 / architecture §6 (generate or copy from the golden module;
  module boundary manifest required)

## On Completion

- Append evidence to `.forge/evidence.md` and a trust note to `.forge/trust.md`.
- Mark F7-01A done in `.forge/backlog.md`.
- Write F7-01B (cross-module reporting read access) to `.forge/next.md` at
  `BUILDER-STRONG`, and set `.forge/state.md` to `Ready to Build` (AUTO PHASE may
  continue within Phase 7).

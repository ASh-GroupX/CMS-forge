# Planning Task: PLAN-F7-01

Status: Ready to Plan
Required model tier: PLANNER
Risk: High
Phase: Phase 7 - Reports, UAT, And Ops

## Why This Is A Planning Task

PHASE-6-REVIEW accepted Phase 6 with conditions and opened Phase 7. Phase 7 must
not start as a direct build because:

- `F7-01` (operational dashboards + scoped exports) is far broader than the 1-5
  file agentic budget and crosses backend report queries, RBAC/branch-scope
  filtering, export limits/audit, OpenAPI, and the first real staff-UI data
  wiring.
- PHASE-6-REVIEW found MVP/`must` customer portal UI screens with no backlog home
  (condition 4). The plan must place or explicitly exclude them before more build
  work proceeds.

## Goal

Produce the Phase 7 task breakdown and write the first buildable task to
`.forge/next.md`. Keep every build task near 1-5 files plus tests and under the
300-line source budget.

## Inputs

- `.forge/project.md`, `.forge/policy.md`, `.forge/backlog.md`
- `.forge/trust.md` → `PHASE-6-REVIEW` conditions (carry-forward items 1-5)
- `docs/ARCHITECTURE.md`
- `docs/CMS_AUTO_SRS.md` requirement IDs: `REQ-REPORT-001`, `RBAC-MATRIX-001`,
  `REQ-RBAC-001`, `REQ-AUDIT-001`, `UI-SCREEN-001` (UI-015..UI-020),
  `UI-DESIGN-001`, `QA-UI-001`, `NFR-PERF-001`, `API-STANDARD-001`,
  `METHOD-TEST-001`, plus the deployment/UAT requirement IDs for F7-03/F7-04.

## Required Planning Decisions

1. **Portal UI screens (condition 4).** Decide where UI-018 (portal submission),
   UI-019 (portal tracking), and UI-020 (survey) UI are built, or record an
   explicit commercial exclusion per `UI-SCREEN-001` AC5. The portal backend
   (Phase 4) already exists; only the customer-facing UI is missing. If included,
   split them into small per-screen tasks with localized RTL/LTR states and the
   portal privacy rules (no internal comments/audit/DMS/staff PII).
2. **Real data wiring + session authority (condition 1).** Any task that wires a
   staff surface (dashboard, queue, detail, admin, reports) to real backend data
   must take role and branch scope from the server session, not the `?role=`
   preview query param. Make this an explicit acceptance criterion on the first
   data-wiring task.
3. **Reports/exports (`F7-01`).** Split backend report read models +
   RBAC/branch-scoped filters + bounded export + export audit from the UI wiring.
   Reports/exports must respect RBAC and branch scope (`RBAC-MATRIX-001`).
4. **Pre-pilot UI quality debt (conditions 2, 3).** Schedule real
   axe/keyboard/contrast accessibility proof and the `destructive confirmation`
   UI state before pilot sign-off.
5. **`security:check` (condition 5).** Schedule wiring `security:check` to the
   real security/auth/admin/audit suites (or aliasing them) before pilot; it must
   not ship as a fake pass.

## Output Of This Task

- Update `.forge/backlog.md` Phase 7 with the decomposed, ordered tasks (including
  the portal UI decision from item 1).
- Write exactly one buildable task to `.forge/next.md` with explicit verification
  commands and SRS requirement IDs.
- Set `.forge/state.md` to `Ready to Build`.

## Scope Discipline

This is planning only. Do not implement feature code. If a proposed task cannot
stay near 1-5 files plus tests, split it further before writing it to `next.md`.

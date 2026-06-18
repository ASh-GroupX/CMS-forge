# Phase Review Task: PHASE-2-REVIEW - Complaint Core Acceptance Review

Status: Needs Phase Review
Required model tier: PHASE-REVIEWER
Risk: High
Phase: Phase 2 - Complaint Core

## Why This Exists

All Phase 2 backlog tasks are complete. A fresh PHASE-REVIEWER must decide whether
Complaint Core is accepted before Forge may plan or build Phase 3.

## Review Scope

Review Phase 2 only:

- F2-01A through F2-04C source, tests, OpenAPI, migrations, and Forge records
- `.forge/backlog.md`
- `.forge/evidence.md`
- `.forge/trust.md`
- `.forge/state.md`
- `.forge/next.md`
- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/CMS_AUTO_SRS.md` requirement IDs cited by Phase 2 evidence

Do not implement Phase 3 work during this review.

## Required Review Work

- Re-run the Phase 2 proof surface and label results honestly:
  - `corepack pnpm lint`
  - `corepack pnpm typecheck`
  - `corepack pnpm test`
  - `corepack pnpm test:api -- workflow`
  - `corepack pnpm openapi:check`
- Confirm every Phase 2 backlog task has evidence and trust entries.
- Inspect the complaint workflow, create, queue, detail, and comment paths for:
  - backend-owned workflow authority
  - server-session role and branch authority
  - same-transaction status history/audit for state changes
  - append-only audit discipline
  - portal/public privacy boundaries
  - OpenAPI drift coverage
  - allowed and denied RBAC/branch-scope tests
  - file-size and module-boundary compliance
- Cross-check cited SRS requirement IDs against `docs/CMS_AUTO_SRS.md`.

## Decision Output

Write a Phase 2 review entry to `.forge/trust.md` and update `.forge/state.md`.

Allowed decisions:

- `Accept Phase`: Phase 3 may start; set state to `Ready to Plan` and write the
  first Phase 3 planner task to `.forge/next.md`.
- `Accept With Conditions`: Phase 3 may start with explicit non-blocking
  carry-forward conditions; set state to `Ready to Plan` and write the first Phase 3
  planner task to `.forge/next.md`.
- `Repair Required`: set state to `Ready to Build` or `Ready to Plan` for the
  smallest repair task and write that task to `.forge/next.md`.
- `Redo Phase`: set state to `Blocked` with the reason and required human decision.

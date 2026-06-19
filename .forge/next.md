# Plan Task: PLAN-F7-03A - Split Real Session-Bound Staff UI Data Wiring

Status: Ready to Plan
Required model tier: PLANNER
Risk: High (web authority must come from server session, not preview query params)
Phase: Phase 7 - Reports, UAT, And Ops

## Goal

Split F7-03A into the smallest buildable task(s) for real staff login and
session-bound web data wiring.

## Why Planning Is Required

The backlog item spans multiple authority boundaries: staff login UI/API calls,
server component cookie forwarding, `/auth/me` principal resolution, and removal
of `?role=` as an authority source before real data wiring. Building it as one
task is likely to exceed the 1-5 file budget and risks weakening RBAC/branch
scope.

## Inputs

- `.forge/backlog.md` Phase 7 F7-03
- `.forge/trust.md` PHASE-6 carry-forward condition 1
- `docs/CMS_AUTO_SRS.md` requirements:
  - REQ-RBAC-001
  - UI-SCREEN-001
  - REQ-AUTH-001
- Existing web staff shell and API client code under `apps/web/src`
- Existing auth routes and `/auth/me` backend contract

## Output

- Write the first buildable F7-03A subtask to `.forge/next.md`.
- Keep scope near 1-5 files plus tests.
- Include exact proof commands.
- Set `.forge/state.md` to `Ready to Build`.

## Guardrails

- No frontend authority from `?role=` for real data.
- Roles and branch scope must come from the server session.
- Do not wire real complaint/report data until the session principal source is
  safe.
- No browser token storage.

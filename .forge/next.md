# Plan Task: PLAN-F6-01D-PASSWORD-RESET-BACKEND-GAP

Status: Needs planning
Required model tier: PLANNER
Risk: High
Phase: Phase 6 - Staff UI

## Problem

`F6-01D` requires a staff password-reset UI contract or a stop if backend reset
routes are absent. The backend reset routes are absent:

- `packages/contracts/openapi.json` documents `/auth/login` and `/auth/logout`
  only.
- `apps/api/src/modules/auth` has no forgot-password, reset-password, or
  password-reset route/service path.

## Scope

Plan the smallest prerequisite repair path before the UI reset contract is built.

Decide whether to:
- add backend password reset request/consume routes first, with audit and safe
  generic messaging, then return to the Phase 6 UI contract; or
- explicitly defer UI-001A with a documented commercial exclusion if password
  reset is out of MVP scope.

## Requirement IDs

- REQ-AUTH-001
- UI-SCREEN-001
- UI-DESIGN-001
- METHOD-TEST-001

## Required Output

- Rewrite `.forge/next.md` with one buildable task.
- Update `.forge/state.md` to `Ready to Build` if a repair/build task is chosen,
  or keep planning blocked with the reason if the scope cannot be split safely.

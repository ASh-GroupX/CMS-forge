# Plan Task: PLAN-F6-03D-COMPLAINT-SUBMIT-SPLIT

Status: Ready to Plan
Required model tier: PLANNER
Risk: High
Phase: Phase 6 - Staff UI

## Goal

Split `F6-03D - Submit complaint through backend API with success, validation
error, and preserved-input states` into small buildable Phase 6 tasks.

## Why Planning Is Required

The backlog item is broader than one safe builder slice. It crosses:

- frontend write-client behavior for `POST /complaints`;
- cookie credentials and likely CSRF/session handling;
- API validation envelope mapping into field errors;
- preserved form input state after success/error;
- integration with the existing render-only create/lookup/attachment surface;
- focused web tests and possibly auth/API contract checks.

## Planner Inputs

- `.forge/backlog.md`
- `.forge/evidence.md`
- `.forge/trust.md`
- `docs/ARCHITECTURE.md`
- `docs/CMS_AUTO_SRS.md`
- Existing web files under `apps/web/src/app`
- Existing complaint API/OpenAPI contract for `POST /complaints`

## Planner Output

- Write the next single buildable `F6-03D*` task to `.forge/next.md`.
- Keep each task near 1-5 files plus tests.
- Preserve Phase 6 scope and do not start Phase 7 work.
- Set `.forge/state.md` to `Ready to Build`.

## Requirement IDs

- UI-SCREEN-001
- UI-DESIGN-001
- REQ-COMPLAINT-001
- REQ-RBAC-001
- API-STANDARD-001
- METHOD-API-001
- METHOD-TEST-001

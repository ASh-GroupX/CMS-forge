# Next Task: PLAN-F1-05C - Split Branches Golden CRUD Behavior

Status: Ready to Plan
Required model tier: PLANNER
Risk: High
Phase: Phase 1 - Security Baseline

## Why This Exists

`F1-05C - Branches golden CRUD endpoints, RBAC, audit, and pattern freeze` is too
broad for one builder task. It likely touches controller, service, repository,
DTOs, API tests, API suite registration, OpenAPI, app module wiring, audit
behavior, RBAC, and pattern documentation.

## Scope

Planning only. Split `F1-05C` into ordered buildable tasks that each stay near
1 to 5 files plus focused tests.

Minimum split to consider:

1. Branch read/list endpoint with Admin RBAC and OpenAPI.
2. Branch create/update/deactivate service behavior with audit entries.
3. Branch API tests and golden CRUD pattern documentation/freeze.

Do not implement source code in this planning task.

## Out Of Scope

- Feature implementation.
- Phase review.
- Login rate limiting or CSRF (`F1-06`).

## Requirement IDs

- REQ-ADMIN-001
- METHOD-MODULAR-001
- METHOD-AUDIT-001
- METHOD-API-001
- METHOD-TEST-001
- NFR-MAINT-001
- NFR-SEC-002

## Acceptance Criteria

- `.forge/next.md` contains only the first buildable branches CRUD task.
- `.forge/state.md` is `Ready to Build` after planning.
- Backlog has small ordered branches CRUD subtasks under the `F1-05` umbrella.
- The first build task includes exact verification commands and SRS IDs.
- Scope stays near 1 to 5 files plus tests.

## Verification Commands

- `rg -n "PLAN-F1-05C|F1-05C|F1-05D|Ready to Build|300" .forge/backlog.md .forge/next.md .forge/state.md`

## Evidence To Record

Append `PLAN-F1-05C - Split Branches Golden CRUD Behavior` to
`.forge/evidence.md` with honest labels.

# Next Task: PLAN-F1-03 - Split Audit Search/Export And Append-Only Enforcement

Status: Ready to Plan
Required model tier: PLANNER
Risk: High
Phase: Phase 1 - Security Baseline

## Why This Exists

`F1-03 - Audit log search/export and append-only enforcement` is too broad for one
builder task. It likely spans a new audit module, admin authorization, search
query validation, export limits, OpenAPI, tests, and DB/application append-only
proof. Split it before coding.

## Scope

Planning only. Split `F1-03` into ordered buildable tasks that each stay near
1 to 5 files plus focused tests.

Minimum split to consider:

1. `F1-03A` - audit module read/search endpoint for authorized admins only, using
   existing `AuditLog` data and RBAC guard.
2. `F1-03B` - audit export endpoint with configured limits and branch/role scope.
3. `F1-03C` - append-only enforcement proof for audit logs (application behavior
   and, if feasible in scope, DB-level guard/migration).

Do not implement source code in this planning task.

## Out Of Scope

- Feature implementation.
- Phase review.

## Requirement IDs

- REQ-AUDIT-001
- NFR-SEC-002
- METHOD-AUDIT-001
- METHOD-API-001
- METHOD-TEST-001
- API-STANDARD-001

## Acceptance Criteria

- `.forge/next.md` contains only the first buildable audit task.
- `.forge/state.md` is `Ready to Build` after planning.
- Backlog is split into small ordered F1-03 subtasks.
- The first build task includes exact verification commands and SRS IDs.
- Scope stays near 1 to 5 files plus tests.

## Verification Commands

- `rg -n "PLAN-F1-03|F1-03A|F1-03B|F1-03C|Ready to Build|300" .forge/backlog.md .forge/next.md .forge/state.md`

## Evidence To Record

Append `PLAN-F1-03 - Split Audit Search/Export And Append-Only Enforcement` to
`.forge/evidence.md` with honest labels.

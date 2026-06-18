# Next Task: PLAN-F1-01E - Split Final Auth Foundation Gate

Status: Ready to Plan
Required model tier: PLANNER
Risk: High

## Why This Exists

`F1-01E - Auth audit entries, OpenAPI contract, and security proof (Verify Gate:
required)` is still too large for one build task. It bundles HTTP login/logout
routes, DTOs, auth audit writes, OpenAPI paths/schemas, final security proof, and
the independent verify gate.

Forge requires small tasks. Replan before coding the final auth foundation.

## Scope

Split `F1-01E` into ordered buildable tasks that each stay near 1 to 5 files
plus focused tests.

Minimum split to consider:

1. `F1-01E1` - auth controller/module and login/logout HTTP routes only, using
   existing auth service methods.
2. `F1-01E2` - auth audit entries for login success, login failure, and logout.
3. `F1-01E3` - OpenAPI contract wiring and final auth security proof.

Mark the final task that completes route, audit, OpenAPI, and proof as
`Verify Gate: required`.

Do not implement source code in this planning task.

## Requirement IDs

- CONTRACT-READINESS-002
- ARCH-AUTH-001
- REQ-AUTH-001
- REQ-AUDIT-001
- NFR-SEC-001
- METHOD-API-001
- METHOD-AUDIT-001
- METHOD-TEST-001
- API-STANDARD-001

## Expected Files

- `.forge/backlog.md`
- `.forge/next.md`
- `.forge/state.md`
- `.forge/evidence.md`

## Acceptance Criteria

- The broad `F1-01E` backlog item is replaced with small ordered final-auth
  subtasks.
- `.forge/next.md` contains only the first buildable final-auth subtask.
- `.forge/state.md` is `Ready to Build` after planning.
- The final auth foundation task remains marked `Verify Gate: required`.
- The first build task includes exact verification commands and SRS IDs.

## Verification Commands

- `rg -n "PLAN-F1-01E|F1-01E1|F1-01E2|Verify Gate|required|Ready to Build|300" .forge/backlog.md .forge/next.md .forge/state.md`

## Evidence To Record

Append `PLAN-F1-01E - Split Final Auth Foundation Gate` to `.forge/evidence.md`
with honest labels.

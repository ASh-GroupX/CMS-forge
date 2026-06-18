# Next Task: PLAN-F1-06 - Split Login Rate Limiting And CSRF Protection

Status: Ready to Plan
Required model tier: PLANNER
Risk: High
Phase: Phase 1 - Security Baseline

## Why This Exists

`F1-06` combines login rate limiting and CSRF protection for
session-authenticated mutation routes. Both are blocking Phase 1 security-baseline
items from `VERIFY-F1-01E`, but they touch different trust boundaries and should be
split before implementation.

## Scope

- Read `NFR-SEC-001` in `docs/CMS_AUTO_SRS.md`, the current auth/session guards,
  and the mutation route surface.
- Split F1-06 into small build tasks, likely rate limiting first and CSRF second,
  unless the architecture points to a safer order.
- Each planned build task must stay near 1-5 files plus tests and include exact
  verification commands.
- Preserve existing auth/session/RBAC behavior and evidence requirements.

## Out Of Scope

- Implementing rate limiting or CSRF in the planning task.
- Changing auth, branch, audit, or OpenAPI source code.
- Starting Phase 2.

## Requirement IDs

- NFR-SEC-001
- REQ-AUTH-001
- METHOD-AUDIT-001
- METHOD-API-001
- METHOD-TEST-001
- NFR-MAINT-001
- NFR-SEC-002

## Acceptance Criteria

- `.forge/next.md` contains one buildable F1-06 task with BUILDER-STRONG tier.
- `.forge/state.md` is set back to `Ready to Build`.
- The planned task has a tight scope, exact verification commands, and security
  self-check requirements.
- Remaining F1-06 subtasks are represented in backlog or next-task notes.

## Verification Commands

- `rg -n "F1-06|NFR-SEC-001|Ready to Build|BUILDER-STRONG" .forge/backlog.md .forge/next.md .forge/state.md`

## Evidence To Record

Append `PLAN-F1-06 - Split Login Rate Limiting And CSRF Protection` to
`.forge/evidence.md` with honest labels.

## Next After Completion

After planning, AUTO PHASE may resume on the first F1-06 build task if state is
`Ready to Build`.

# Next Task: PLAN-F1-00 - Split Phase 1 Into Agentic Build Tasks

Status: Ready to Plan
Required model tier: PLANNER
Risk: High

## Why This Exists

`F1-01 - Staff Auth With Argon2id And HttpOnly Sessions` currently includes too
much for one agentic build task: Prisma migration, NestJS bootstrap, shared core
kernel, auth behavior, OpenAPI, and tests.

Forge now requires small tasks and source files. Replan before coding.

## Scope

Split the current Phase 1 start into ordered, buildable tasks.

Minimum split:

1. `F1-00A` - generate/apply the Prisma migration from the F0-08 schema.
2. `F1-00B` - bootstrap NestJS and the minimal core kernel.
3. `F1-01` - staff auth only: login, logout, session validation, audit, OpenAPI,
   and focused tests. Mark this task `Verify Gate: required` — it is the
   auth/session/RBAC foundation the rest of Phase 1 builds on, so AUTO PHASE pauses
   for an independent VERIFY here before F1-02+ proceed.

Keep each task near 1 to 5 files plus tests. If a task would create a source file
over 300 lines, split it further.

## Expected Files

- `.forge/backlog.md`
- `.forge/next.md`
- `.forge/state.md`

Do not implement source code in this planning task.

## Acceptance Criteria

- Phase 1 backlog starts with the smallest ordered tasks needed before auth.
- `.forge/next.md` contains only the first buildable task.
- `.forge/state.md` is `Ready to Build` after planning.
- The first build task includes exact verification commands and SRS IDs.

## Verification Commands

- `rg -n "F1-00A|F1-00B|F1-01|300|Ready to Build" .forge/backlog.md .forge/next.md .forge/state.md`

## Evidence To Record

Append `PLAN-F1-00 - Split Phase 1 Into Agentic Build Tasks` to
`.forge/evidence.md` with honest labels.

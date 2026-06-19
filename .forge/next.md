# Verify Task: VERIFY-F3-04B - Closure/Reopen Side-Effect Scheduling Gate

Status: Needs Verify
Required model tier: independent VERIFY
Risk: High
Phase: Phase 3 - SLA And Workflow Operations

## Why This Exists

`F3-04B` adds post-commit side-effect scheduling for close and reopen workflow
transitions. Verify that queueing happens only after the status/history/audit
transaction succeeds, and never on denied or failed transitions.

## Scope To Review

- `apps/api/src/modules/complaints/complaints.module.ts`
- `apps/api/src/modules/complaints/complaints.service.ts`
- `apps/api/test/workflow/transition-matrix.test.ts`
- `.forge/evidence.md`
- `.forge/trust.md`

## Verify Requirements

- Confirm `ComplaintsModule` imports `NotificationsModule`.
- Confirm `ComplaintsService` injects only `NotificationsService` from the
  notifications module.
- Confirm successful `CLOSE` queues `survey.schedule.internal` after the workflow
  transaction writes status, status history, and WORKFLOW audit.
- Confirm successful `REOPEN` queues `workflow.reopened.internal` after the
  workflow transaction writes status, status history, and WORKFLOW audit.
- Confirm side effects are not queued inside the complaint transaction.
- Confirm validation failure, RBAC denial, branch-scope denial, stale persisted
  status, and transaction failure do not queue side effects.
- Confirm no notification repository/DTO/Prisma model, worker, provider, route,
  schema, migration, survey module behavior, SLA recalculation, OpenAPI, UI,
  portal, report, comment, or attachment work was added.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- workflow`
- `corepack pnpm test:api -- notifications`
- `corepack pnpm openapi:check`

## Expected Output

If accepted:

- Append VERIFY evidence to `.forge/trust.md`.
- Because Phase 3 backlog is complete, set `.forge/state.md` to
  `Needs Phase Review`.
- Write a Phase 3 review task to `.forge/next.md`.
- Do not start Phase 4 until PHASE-REVIEWER accepts Phase 3.

If repair is needed:

- Set `.forge/state.md` to `Needs Repair`.
- Write the smallest repair task to `.forge/next.md`.
- Keep Phase 3 stopped until the repair passes its verify gate.

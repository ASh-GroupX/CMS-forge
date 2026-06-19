# Verify Task: VERIFY-F3-04A - Workflow Required Data Gate

Status: Needs Verify
Required model tier: independent VERIFY
Risk: High
Phase: Phase 3 - SLA And Workflow Operations

## Why This Exists

`F3-04A` changes complaint workflow validation before status/history/audit writes.
Verify that required-data gaps fail closed before transactions, while valid
transitions keep the same canonical workflow persistence behavior.

## Scope To Review

- `apps/api/src/modules/complaints/complaints.service.ts`
- `apps/api/src/modules/complaints/dto/complaint-transition.dto.ts`
- `apps/api/test/workflow/transition-matrix.test.ts`
- `packages/contracts/openapi.json`
- `tools/openapi-check.mjs`
- `.forge/evidence.md`
- `.forge/trust.md`

## Verify Requirements

- Confirm missing or blank required transition data rejects with
  `VALIDATION_FAILED` before repository transaction, status update, status history,
  or WORKFLOW audit writes.
- Confirm `reason` is required for `SEND_BACK`, `REOPEN`, `REJECT_AS_INVALID`,
  `REJECT_AFTER_REVIEW`, `REJECT_AFTER_INVESTIGATION`, and `REJECT_RESOLUTION`.
- Confirm `RESOLVE` and `RESOLVE_DIRECTLY` require `resolutionType`,
  `resolutionSummary`, and backend-owned `actorId` from the server session.
- Confirm `CLOSE` requires closure confirmation in `reason` and non-empty
  `customerCommunicationStatus`.
- Confirm valid required-data transitions still update status, insert status
  history, and write WORKFLOW audit in the same transaction.
- Confirm existing invalid-transition, unauthorized-role, stale-status, and
  branch-scope denial behavior still passes.
- Confirm OpenAPI documents the transition request fields and
  `openapi:check` protects them.
- Confirm no schema changes, migrations, comments, attachments, notifications, SLA
  recalculation, survey scheduling, routes, UI, portal behavior, or provider calls
  were added.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- workflow`
- `corepack pnpm openapi:check`

## Expected Output

If accepted:

- Append VERIFY evidence to `.forge/trust.md`.
- Set `.forge/state.md` to `Ready to Build`.
- Write `F3-04B - Add Closure/Reopen Side-Effect Scheduling Without In-Transaction Side Effects` to `.forge/next.md`.
- Continue AUTO PHASE only after the gate is explicitly accepted.

If repair is needed:

- Set `.forge/state.md` to `Needs Repair`.
- Write the smallest repair task to `.forge/next.md`.
- Keep Phase 3 stopped until the repair passes its verify gate.

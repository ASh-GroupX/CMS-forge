# Verify Task: VERIFY-F3-03A2 - Queued Internal Notification Service Gate

Status: Needs Verify
Required model tier: independent VERIFY
Risk: High
Phase: Phase 3 - SLA And Workflow Operations

## Why This Exists

`F3-03A2` creates the notifications public service that `F3-03A3` will call from
SLA breach processing. Verify the service boundary and safe queue semantics before
SLA imports and uses it.

## Verify Scope

- Review the build changes in:
  - `apps/api/src/modules/notifications/MODULE.md`
  - `apps/api/src/modules/notifications/notifications.module.ts`
  - `apps/api/src/modules/notifications/notifications.repository.ts`
  - `apps/api/src/modules/notifications/notifications.service.ts`
  - `apps/api/src/modules/notifications/notifications.controller.spec.ts`
  - `apps/api/src/modules/notifications/notifications.service.spec.ts`
  - `apps/api/test/notifications/queue.test.ts`
  - `tools/api-test.mjs`
- Confirm `NotificationsService` remains the public surface and no other module
  repository is imported.
- Confirm queued internal notifications persist as `IN_APP` / `QUEUED` rows only.
- Confirm provider delivery, provider credentials/results, sent/failed state, routes,
  OpenAPI paths, BullMQ workers, SLA imports, schema changes, migrations, UI, portal
  behavior, and template management were not added.
- Confirm validation denies blank template codes and unsafe payload keys before
  writing.
- Confirm evidence labels are honest and the required commands actually ran.

## Requirement IDs

- REQ-NOTIFY-001
- REQ-SLA-001
- SLA-CALENDAR-001
- ARCH-WORKFLOW-001
- METHOD-AUDIT-001
- METHOD-TEST-001
- API-STANDARD-001

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- notifications`
- `corepack pnpm openapi:check`

## Expected Output

Update `.forge/trust.md` with:

- Builder honesty: Honest, Inflated, or Fabricated
- Code quality: Good, Acceptable, or Poor
- Recommendation: Accept, Repair, or Redo

On `Accept`, write `F3-03A3` to `.forge/next.md` and set `.forge/state.md` to
`Ready to Build`. On `Repair` or `Redo`, write the smallest repair task and set
`.forge/state.md` to `Needs Repair`.

# Verify Task: VERIFY-F3-03A2-REPAIR - Queued Internal Notification Service Repair Gate

Status: Needs Verify
Required model tier: independent VERIFY
Risk: High
Phase: Phase 3 - SLA And Workflow Operations

## Why This Exists

`REPAIR-F3-03A2` fixes the payload-validation gap found by `VERIFY-F3-03A2`
before `F3-03A3` builds SLA integration on the notifications public service.

## Verify Scope

- Review the repair changes in:
  - `apps/api/src/modules/notifications/notifications.service.ts`
  - `apps/api/test/notifications/queue.test.ts`
- Confirm payload validation allows JSON primitives, arrays, and plain objects.
- Confirm non-plain payload objects such as `Date`, `Map`, and `Set` reject before
  repository writes.
- Confirm unsafe payload-key denial still rejects before repository writes.
- Confirm no provider delivery, routes, OpenAPI paths, BullMQ workers, SLA imports,
  schema changes, migrations, UI, portal behavior, or template management was added.
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

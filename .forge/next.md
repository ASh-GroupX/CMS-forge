# Verify Task: VERIFY-F3-03A3 - SLA Escalation Notification Integration Gate

Status: Needs Verify
Required model tier: independent VERIFY
Risk: High
Phase: Phase 3 - SLA And Workflow Operations

## Why This Exists

`F3-03A3` wires SLA breach creation to the notifications public service. Verify the
cross-module boundary and queue timing before Phase 3 continues to workflow closure
and reopen behavior.

## Verify Scope

- Review the build changes in:
  - `apps/api/src/modules/sla/sla.module.ts`
  - `apps/api/src/modules/sla/sla.service.ts`
  - `apps/api/test/sla/deadline-calculator.test.ts`
- Confirm `SlaModule` imports `NotificationsModule` and `SlaService` injects only
  `NotificationsService`.
- Confirm SLA does not import the notifications repository, DTOs, Prisma models,
  routes, workers, or provider code.
- Confirm `runBreachJob` queues exactly one internal notification only after a newly
  inserted breach event.
- Confirm duplicate breach retries, future deadlines, terminal complaints, and other
  skipped rows do not queue notifications.
- Confirm notification payload is JSON-safe and contains no secrets, provider
  credentials/results, portal data, audit logs, internal comments, DMS codes, or
  staff PII.
- Confirm no provider delivery, template management, HTTP routes, OpenAPI paths,
  BullMQ workers, schema changes, migrations, UI, portal behavior, reports, or direct
  writes to another module's tables were added.
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
- `corepack pnpm test:api -- sla`
- `corepack pnpm test:api -- notifications`
- `corepack pnpm openapi:check`

## Expected Output

Update `.forge/trust.md` with:

- Builder honesty: Honest, Inflated, or Fabricated
- Code quality: Good, Acceptable, or Poor
- Recommendation: Accept, Repair, or Redo

On `Accept`, write `F3-04A` to `.forge/next.md` and set `.forge/state.md` to
`Ready to Build`. On `Repair` or `Redo`, write the smallest repair task and set
`.forge/state.md` to `Needs Repair`.

# Verify Task: VERIFY-F3-02B - SLA Breach Job Gate

Status: Needs Verify
Required model tier: independent VERIFY
Risk: High
Phase: Phase 3 - SLA And Workflow Operations

## Why This Exists

`F3-02B` adds SLA breach-job behavior that `F3-03A` will build on to queue
escalation notification events. This gate must verify the idempotent breach event
pattern before escalation work starts.

## Verify Scope

- Review the build changes in:
  - `apps/api/src/modules/sla/sla.repository.ts`
  - `apps/api/src/modules/sla/sla.service.ts`
  - `apps/api/test/sla/deadline-calculator.test.ts`
- Confirm breach evaluation uses backend-recorded `DEADLINE_SET` events, not client
  input.
- Confirm breach events are created through the unique idempotency key with duplicate
  skipping.
- Confirm duplicate retries are reported as skipped, not newly created.
- Confirm future deadlines skip without writes.
- Confirm terminal complaint statuses available in the current schema skip without
  writes.
- Confirm no escalation notification delivery, provider calls, queues, workflow
  changes, routes, OpenAPI paths, UI, portal behavior, schema changes, or migrations
  were introduced.
- Confirm evidence labels are honest and the required commands actually ran.

## Requirement IDs

- REQ-SLA-001
- SLA-CALENDAR-001
- ARCH-WORKFLOW-001
- REQ-NOTIFY-001
- METHOD-AUDIT-001
- METHOD-TEST-001
- API-STANDARD-001

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- sla`
- `corepack pnpm openapi:check`

## Expected Output

Update `.forge/trust.md` with:

- Builder honesty: Honest, Inflated, or Fabricated
- Code quality: Good, Acceptable, or Poor
- Recommendation: Accept, Repair, or Redo

On `Accept`, write `F3-03A` to `.forge/next.md` and set `.forge/state.md` to
`Ready to Build`. On `Repair` or `Redo`, write the smallest repair task and set
`.forge/state.md` to `Needs Repair`.

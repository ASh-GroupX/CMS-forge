# Verify Task: VERIFY-F3-02A-REPAIR - SLA Warning Job Repair Gate

Status: Needs Verify
Required model tier: independent VERIFY
Risk: High
Phase: Phase 3 - SLA And Workflow Operations

## Why This Exists

`REPAIR-F3-02A` fixes the `VERIFY-F3-02A` findings before `F3-02B` builds breach
jobs on the same SLA job/idempotency pattern.

## Verify Scope

- Review the repair changes in:
  - `apps/api/src/modules/sla/sla.repository.ts`
  - `apps/api/src/modules/sla/sla.service.ts`
  - `apps/api/test/sla/deadline-calculator.test.ts`
- Confirm `created` counts only newly inserted warning events.
- Confirm duplicate warning retries are reported as skipped.
- Confirm invalid stored policy duration and warning percent values are skipped
  without warning writes.
- Confirm no breach jobs, escalation, notification delivery, provider calls, queues,
  workflow changes, routes, OpenAPI paths, UI, portal, schema changes, or migrations
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

On `Accept`, write `F3-02B` to `.forge/next.md` and set `.forge/state.md` to
`Ready to Build`. On `Repair` or `Redo`, write the smallest repair task and set
`.forge/state.md` to `Needs Repair`.

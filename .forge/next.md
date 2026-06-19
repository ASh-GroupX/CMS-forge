# Build Task: F3-02A - Add Idempotent SLA Warning Job At Configured Threshold

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 3 - SLA And Workflow Operations
Verify Gate: required

## Why This Exists

`F3-01C` records durable deadline events. The next smallest useful job step is
an idempotent warning job that finds deadline events whose warning threshold has
passed and records one warning event per complaint/stage/policy.

## Scope

- Add SLA repository read behavior for due `DEADLINE_SET` events whose warning time
  is at or before a supplied `now`.
- Add service/job behavior that records a `WARNING_SENT` SLA event idempotently for
  each due deadline event.
- Derive warning idempotency keys from the deadline event key so retries do not
  duplicate warnings.
- Use existing stored policy duration/warning percent data; do not add schema.
- Return a small result with scanned count, created/skipped warning count, and
  warning idempotency keys.
- Add focused `apps/api/test/sla/` coverage for due filtering, idempotent warning
  creation, and no-op behavior when nothing is due.

## Out Of Scope

- No breach jobs or escalation.
- No notification delivery, provider adapters, queues, Redis/BullMQ wiring, or
  external side effects.
- No workflow/complaints integration changes.
- No HTTP routes, OpenAPI paths, admin UI, portal, reports, or calendar-hours math.
- No schema changes or migrations.

## Requirement IDs

- REQ-SLA-001
- SLA-CALENDAR-001
- ARCH-WORKFLOW-001
- REQ-NOTIFY-001
- METHOD-AUDIT-001
- METHOD-TEST-001
- API-STANDARD-001

## Acceptance Criteria

- Warning job behavior is backend-owned and uses recorded deadline events as source
  of truth.
- Re-running the job for the same due deadline events creates no duplicate warning
  events.
- No notification provider calls or side effects are introduced.
- Missing or malformed deadline/policy data fails closed with stable SLA errors or
  is safely skipped with test coverage.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- sla`
- `corepack pnpm openapi:check`

## Completion Notes

If checks pass, append evidence/trust for `F3-02A`, mark `F3-02A` done in
`.forge/backlog.md`, and set `.forge/state.md` to `Needs Verify` because this is
the first reusable SLA job/idempotency pattern.

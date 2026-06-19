# Build Task: F3-01C - Record SLA Deadline Events When Complaints Enter SLA-Governed States

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 3 - SLA And Workflow Operations
Verify Gate: required

## Why This Exists

`F3-01A` calculates deadlines and `F3-01B` resolves the stored policy. The next
small step is to persist a deadline event so later warning and breach jobs have a
durable, idempotent source of truth.

## Scope

- Add SLA repository behavior to create an `SlaEvent` deadline row.
- Add `SlaService.recordDeadlineEvent` that accepts server-side complaint/stage
  context, resolves the active policy, calculates `dueAt`, and writes one deadline
  event.
- Use a deterministic idempotency key derived from complaint ID, stage, policy ID,
  and entered timestamp so retrying the same record request does not duplicate the
  event.
- Return a stable deadline-event result containing complaint ID, policy ID, stage,
  `dueAt`, and idempotency key.
- Fail closed with `SLA_POLICY_MISSING` when policy resolution or calculation fails.
- Add focused `apps/api/test/sla/` coverage for successful event recording,
  idempotent duplicate handling, and missing-policy denial.

## Out Of Scope

- No workflow/complaints integration yet.
- No warning or breach jobs.
- No escalation, notifications, queues, provider calls, or external side effects.
- No HTTP routes, OpenAPI paths, admin UI, portal, reports, or calendar-hours math.
- No schema changes or migrations.

## Requirement IDs

- REQ-SLA-001
- SLA-CALENDAR-001
- ARCH-WORKFLOW-001
- METHOD-AUDIT-001
- METHOD-TEST-001
- API-STANDARD-001

## Acceptance Criteria

- SLA deadline events are persisted by backend service/repository code only.
- Duplicate record requests for the same complaint/stage/policy/entered timestamp
  are idempotent.
- Missing policy returns `SLA_POLICY_MISSING` and creates no event.
- No jobs, notifications, routes, UI, portal exposure, or provider calls are added.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- sla`
- `corepack pnpm openapi:check`

## Completion Notes

If checks pass, append evidence/trust for `F3-01C`, mark `F3-01C` done in
`.forge/backlog.md`, and set `.forge/state.md` to `Needs Verify` because SLA
warning and breach jobs build on these recorded deadline events.

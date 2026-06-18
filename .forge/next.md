# Build Task: F3-01A - Generate SLA Module And Deadline Calculator

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 3 - SLA And Workflow Operations
Verify Gate: required

## Why This Exists

Phase 3 SLA jobs, breach escalation, and reopen/reassignment recalculation need
one deterministic backend SLA calculator before any worker or notification code
is safe to build. The Prisma schema already has `SlaPolicy` and `SlaEvent`; this
task creates the `sla` module boundary and the first pure calculation behavior.

## Scope

- Generate the `sla` module with `corepack pnpm generate:module -- sla`.
- Fill `apps/api/src/modules/sla/MODULE.md` with the real boundary:
  public `SlaService`, owns `sla_policies` and `sla_events`, may depend on
  `core/http-kernel`, `core/audit.service`, and public module services only.
- Add deterministic deadline calculation in `SlaService` for stored-policy input:
  `severity`, `stage`, `durationMinutes`, `warningPercent`, `branchTimezone`,
  `workingCalendarMode`, `enteredAt`, and optional `policyId`.
- Support `WorkingCalendarMode.ALWAYS_ON` by calculating `dueAt` and `warningAt`
  from `enteredAt`, duration, and warning percent on the backend.
- Validate policy inputs fail closed with stable `SLA_POLICY_MISSING` errors for
  missing/invalid duration, warning percent, stage, severity, branch timezone, or
  unsupported calendar configuration.
- Add a focused API test suite under `apps/api/test/sla/` and wire `sla` into
  `tools/api-test.mjs`.

## Out Of Scope

- No database repository reads or writes yet.
- No SLA warning/breach jobs.
- No notification, escalation, queue, or provider adapter behavior.
- No HTTP routes, OpenAPI paths, admin UI, calendar admin screens, portal, reports,
  or workflow transition changes.
- No hardcoded production provider/template behavior.

## Requirement IDs

- REQ-SLA-001
- SLA-CALENDAR-001
- ARCH-WORKFLOW-001
- METHOD-AUDIT-001
- METHOD-TEST-001
- API-STANDARD-001

## Acceptance Criteria

- `SlaService` returns deterministic ISO-compatible `dueAt` and `warningAt` values
  for `ALWAYS_ON` policies, including the default SLA durations:
  Critical 120 minutes, High 480 minutes, Medium 1440 minutes, Low 4320 minutes.
- Tests cover branch timezone validation and prove SLA calculation happens in API
  code, not browser/client code.
- Invalid or unsupported policy input returns `SLA_POLICY_MISSING`; no generic
  thrown errors leak.
- Generated module source files stay under the 300-line budget.
- Evidence records the High-risk security self-check from `.forge/policy.md`,
  including that no state change, audit bypass, side effect, portal exposure, or
  secret logging was introduced.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- sla`
- `corepack pnpm openapi:check`

## Completion Notes

If all checks pass, append evidence/trust for `F3-01A`, mark `F3-01A` done in
`.forge/backlog.md`, and set `.forge/state.md` to `Needs Verify` because this is
a Verify Gate for the Phase 3 SLA foundation.

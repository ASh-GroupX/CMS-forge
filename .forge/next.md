# Build Task: P10-07A1 Task/promise KPI formulas from task events

Status: Ready to Build
Required model tier: BUILDER-STRONG
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Risk: High (scoped management reporting)

## SRS IDs

- REQ-REPORT-001
- REQ-RBAC-001
- NFR-SEC-002
- METHOD-MODULAR-001
- METHOD-API-001
- METHOD-TEST-001

## Scope

Build only the first backend KPI slice: a reports-side pure helper that derives
task and customer-promise KPI values from task rows plus `TaskStatusHistory`
events.

Implement:
- `onTimeCompletionPercent`
- `activeOverdueCount`
- `averageDelayHours`
- `customerPromiseKeptPercent`

Rules:
- Completed time comes from status-history events where `toStatus === DONE`, not
  from stored counters or raw closed-count leaderboards.
- Active overdue tasks use current task status + `dueAt` compared with `now`.
- Customer-promise kept percent uses the same event-derived completion logic,
  filtered to `isCustomerPromise`.
- Empty denominators return `0`, not `NaN`.
- No HTTP route, OpenAPI surface, frontend, database migration, or stack proof in
  this slice. P10-07A2/A3/A4 cover wiring, complaint/case KPIs, and route tests.

Expected files:
- `apps/api/src/modules/reports/reports.kpi.ts`
- `apps/api/test/reports/kpi-read-model.test.ts`

If a file would exceed the 300-line source budget, stop and replan instead of
splitting a cohesive helper into noise.

## Acceptance Criteria

- Focused tests prove on-time, late, active-overdue, average-delay, and
  promise-kept calculations from event rows.
- Tests prove the helper does not expose or compute a raw individual closed-count
  leaderboard.
- No state changes are introduced; no audit write is needed for this read-only
  helper.
- Evidence records the High-risk security self-check from `.forge/policy.md`.

## Verification

Run and label honestly:
- `node --import tsx --test apps/api/test/reports/kpi-read-model.test.ts`
- `corepack pnpm test:api -- reports`
- `corepack pnpm typecheck`
- `corepack pnpm openapi:check`
- `corepack pnpm lint`
- `corepack pnpm test`
- `git diff --check`

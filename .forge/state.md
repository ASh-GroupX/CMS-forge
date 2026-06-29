# Current State

Status: Phase 17 reviewed complete
Phase: Phase 17 - Report formula/business-fit proof and matrix reconciliation
Next Task: Next-phase planning/audit stop
Model Tier: Planner/Reviewer

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- `.spec` is absent.
- Phase 16 reviewer stop is complete and clean.
- Phase 17 is reviewed complete after P17A backend KPI/formula work, P17A
  reopen-rate repair, P17B report UI proof, and the Phase 17 reviewer repair.
- The Phase 17 reviewer repair fixed the two blockers from the first reviewer
  stop:
  - `/reports` rows now match the committed safe `ReportRow` contract exactly;
  - REPORT export audit metadata now includes only `{ format, rowCount,
    rowLimit, filters }`, with `filters` limited to `filterBranchId`,
    `categoryId`, `departmentId`, `severity`, `ownerId`, `dateFrom`, and
    `dateTo`.
- The reviewer rerun found no blockers.
- Full reviewer proof passed: `git status --short`, `git diff --check`
  (line-ending warnings only), `corepack pnpm test:api -- reports`,
  `corepack pnpm test:web -- api-client`, `corepack pnpm test:web -- shell`,
  `corepack pnpm test:web -- localization`, `corepack pnpm test:e2e --
  accessibility`, `corepack pnpm test:visual`, `corepack pnpm web:perf`,
  `corepack pnpm openapi:check`, `corepack pnpm typecheck`, and
  `corepack pnpm lint`.
- The worktree remains intentionally dirty with prior Phase 14/P15 changes,
  P16 work, P17A/P17B work, the P17 repair, reviewer Forge bookkeeping, and
  carry-forward work from other phases. Do not clean, stage, or revert unrelated
  changes.

## Current Stop

Next task is a next-phase planning/audit stop only. Do not start implementation
until the planner sets the smallest scoped task.

## Open Carry-Forward / Known Debt

- Related complaint linking remains planned.
- Duplicate warning UI remains planned and should follow backend duplicate or
  related-complaint behavior.
- Vehicle manual/DMS provenance flags remain planned.
- Portal attachment follow-up remains unstarted by Phase 16.

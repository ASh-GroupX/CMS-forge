# Build Task: P9-04A - Work Queue Golden Screen

Status: Ready to Build
Required model tier: BUILDER-STANDARD
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Risk: Medium
Requirements: UI-DESIGN-001 AC1, UI-DESIGN-001 AC2, UI-DESIGN-001 AC3, UI-DESIGN-001 AC4, UI-DESIGN-001 AC5, UI-DESIGN-001 AC6, UI-SCREEN-001 AC1, UI-SCREEN-001 AC2, UI-SCREEN-001 AC3

## Goal

Make `apps/web/src/app/work-queue.tsx` the golden screen pattern for the rest of
the redesign: shadcn primitives, existing tokens, real typed API data only, all
required states, EN/AR RTL proof, accessibility proof, and visual-review artifacts.

Golden candidate: work queue (`UI-003`). It is the daily operating surface and
exercises filters, table density, status/severity/SLA badges, pagination, loading,
empty, error, success, conflict, responsive overflow, and RTL/LTR layout in one
small component.

## Scope

Expected files: 4-5 plus generated review artifacts under `coverage/`.

Allowed:
- `apps/web/src/app/work-queue.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/i18n/staff-shell.ts`
- `apps/web/test/shell/shell.test.ts`
- `tools/web-proof-cases.mjs`

Do not refactor other screens in this task.

## Acceptance

- Work queue uses generated shadcn primitives where they fit: `Card`, `Table`,
  `Button`, `Input`, `Label`, `Select`, `Badge`, and `Skeleton`.
- Remove hardcoded fallback complaint rows from `work-queue.tsx`. Rows render only
  from `ComplaintQueueItem[]` supplied by the existing typed API read path.
- Replace preview/scaffold copy with production-safe localized copy in
  `staff-shell.ts`.
- Work queue supports and proves loading, empty, error, success, and conflict
  states with correct `role="status"` / `role="alert"` behavior.
- Keep backend authority intact: no role, branch scope, workflow, owner, or state
  authority is derived in the component or from query params.
- EN and AR visual cases cover the golden work queue, including RTL/LTR direction
  and horizontal table overflow.
- If visual self-review finds the work queue is not ready to be the pattern, stop
  with `Blocked` and write the smallest repair task. Do not continue to other
  screens.

## Proof Commands

- `corepack pnpm test:web -- shell`
- `corepack pnpm test:e2e -- ui-smoke`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm test:visual`
- `corepack pnpm web:visual-review`
- `corepack pnpm web:perf`
- `corepack pnpm lint`
- `corepack pnpm typecheck`

## Visual Review

After `corepack pnpm web:visual-review`, inspect at least:
- `coverage/web-visual-review/en-work-queue-visual-regression.html`
- `coverage/web-visual-review/ar-work-queue-visual-regression.html`

Record the review result in `.forge/evidence.md` as `Passed`, `Needs Human Review`,
or `Failed`. If the golden screen needs human approval before reuse, set
`.forge/state.md` to `Needs Review` and write a `P9-04B` review task.

## On Success

- Append evidence for P9-04A only.
- Mark P9-04A done in `.forge/backlog.md`.
- Do not start broad refactors until the golden screen is accepted or repaired.
- Replace `.forge/state.md` with the next short snapshot.

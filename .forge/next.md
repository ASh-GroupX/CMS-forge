# P9-04C-1 Dashboard Screen — Golden Pattern Replication

Status: Ready to Build
Required model tier: BUILDER-STANDARD
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Risk: Medium

## Context

P9-04B accepted the golden pattern: real App Router route in `app/(staff)/`,
component in `components/`, no QueuePreviewState, colored badges from design
tokens, null/empty/data three-state, i18n'd. This task replicates that pattern
to the dashboard screen.

P9-04C in the backlog covers "staff shell, login/reset, dashboard, and
notification center." The staff shell layout is already done (`app/(staff)/layout.tsx`
from P9-04A Repair). This task handles the dashboard only. Login/reset and
notification center follow as P9-04C-2 and P9-04C-3.

## Scope (3 files + test update)

1. **`src/components/dashboard-summary/index.tsx`** (NEW)
   - Extract from `src/app/dashboard-summary.tsx`.
   - Props: `{ locale: Locale; data: StaffDashboardSummary | null }`.
     `null` = error state; typed object = success state; add empty/zero state
     (all counts are 0).
   - Use shadcn `Card`, `CardHeader`, `CardContent`, `CardTitle`.
   - Metric cards: open, overdue, SLA warning, closed, average TAT.
   - Loading state: `Skeleton` placeholder cards (4 cards).
   - Error state: `role="alert"` paragraph.
   - All strings from `staffShellText[locale].dashboard` (add keys if missing).
   - No hardcoded colors; use design tokens (`text-status-error` for overdue,
     `text-status-warning` for SLA warning, `text-brand` for average TAT).
   - No role/branch authority in the component.
   - Under 200 lines.

2. **`src/app/(staff)/dashboard/page.tsx`** (NEW)
   - Same pattern as `app/(staff)/complaints/page.tsx`.
   - Server Component; accepts optional `cookieHeader`/`fetchImpl` for tests.
   - Calls `getStaffDashboardSummary(apiInput)` (already exists in
     `src/lib/staff-dashboard-api.ts`).
   - Renders `<DashboardSummary locale={locale} data={data} />`.
   - Under 35 lines.

3. **`src/i18n/staff-shell.ts`** — add `dashboard` keys if the component
   needs strings not already present (check first; add only what is missing).

4. **`test/shell/shell.test.ts`** — add tests for `DashboardPage`:
   - Import `DashboardPage` from `app/(staff)/dashboard/page`.
   - EN labels test (`cookieHeader: ''` — avoids `next/headers` import).
   - AR RTL test (`cookieHeader: ''`).
   - Success state: mock `fetchImpl` returning `StaffDashboardSummary` → check
     metric values rendered.
   - Empty/zero state: all-zero response → check zero counts display.
   - Error state: 403 response → `role="alert"` paragraph.
   - Source safety: `readFileSync('apps/web/src/components/dashboard-summary/index.tsx')`
     → no `QueuePreviewState`, no hardcoded email/secrets.

## Do NOT touch

- `src/app/dashboard-summary.tsx` — keep the legacy file; delete it only after
  all screens replicated and legacy shell retired.
- `src/app/page.tsx` — legacy single-page shell; do not touch.
- Any backend module.

## Verification commands

```
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test:web -- shell
corepack pnpm test:web -- localization
```

All must pass. Honest labels only.

## SRS IDs

UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

## After this task

Write P9-04C-2 (login/reset panel → `components/password-reset/` +
`app/(staff)/auth/reset/page.tsx`) or if the login form does not need a new
route (it lives at `/login` which is outside the staff route group), scope that
task to the notification center instead. Check the existing routes first.

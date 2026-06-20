# Current State

Status: Ready to Build
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Next Task: P9-04C-1 — Dashboard screen: real App Router route + component in components/
Model Tier: BUILDER-STANDARD

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Phase 9 in progress. Arabic i18n fixed (P9-01), anti-mojibake gate live (P9-02),
  shadcn adopted via CLI (P9-03), golden screen delivered (P9-04A Repair), golden
  screen review passed (P9-04B Accept).
- Golden pattern established:
  1. Real App Router route at `app/(staff)/<screen>/page.tsx` (Server Component).
  2. Component in `components/<screen>/index.tsx` (not `app/`).
  3. No QueuePreviewState / preview props — data state driven by `Type | null`.
  4. Colored Badges from design tokens only.
  5. All strings from i18n; no hardcoded user-facing text.
  6. Three-state: null=error, []/zero=empty, data=success.
  7. Optional `cookieHeader`/`fetchImpl` on page for test isolation.
- Staff shell layout done at `app/(staff)/layout.tsx`.
- P9-04B review accepted (BUILDER-STRONG; PHASE-REVIEWER preferred for phase-end).
- Old single-page shell (`src/app/page.tsx`) still exists for legacy compatibility;
  to be removed screen-by-screen as P9-04C..H replicate the golden pattern.

## Next

- P9-04C-1: Replicate golden pattern to dashboard screen.
  - `src/components/dashboard-summary/index.tsx` (from `dashboard-summary.tsx`).
  - `src/app/(staff)/dashboard/page.tsx`.
  - i18n updates if needed.
  - 4-5 new tests in `test/shell/shell.test.ts`.
  - Verify: typecheck, lint, test:web -- shell, test:web -- localization.

## Open carry-forward / known debt

- Old `src/app/work-queue.tsx`, `src/app/dashboard-summary.tsx`, and other `app/`
  component files are legacy; removed screen-by-screen as P9-04C..H finish.
- Badge labels show raw enum values (`IN_PROGRESS`, `HIGH`) — not localized; deferred.
- SLA state field still shows "Backend scoped" placeholder; typed SLA field pending
  backend exposure.
- E2E/visual/screenshot checks: Not Run in this environment (no live stack).
- P9-04C container covers: login/reset, dashboard (→ P9-04C-1), notification center.
  Dashboard is first; login/reset and notifications follow as P9-04C-2/C-3.

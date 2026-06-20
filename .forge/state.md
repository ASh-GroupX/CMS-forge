# Current State

Status: Ready to Plan
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Next Task: PLAN-P9-04D - Split intake group into the next buildable task
Model Tier: PLANNER

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Phase 9 in progress. Arabic i18n fixed (P9-01), anti-mojibake gate live (P9-02),
  shadcn adopted via CLI (P9-03), golden screen delivered (P9-04A Repair), golden
  screen review passed (P9-04B Accept).
- P9-04C is complete:
  1. Dashboard route/component replicated (P9-04C-1).
  2. Password reset route/component replicated (P9-04C-2).
  3. Notification center route/component replicated (P9-04C-3).
- Golden pattern established:
  1. Real App Router route at `app/(staff)/<screen>/page.tsx` (Server Component).
  2. Component in `components/<screen>/index.tsx` (not `app/`).
  3. Legacy `app/<screen>.tsx` wrapper retained until the old shell is retired.
  4. Design tokens and shadcn primitives.
  5. All strings from i18n; no hardcoded user-facing text where the screen has
     dictionary coverage.
  6. Required null/empty/data or explicit UI state coverage per screen.
- Staff shell layout done at `app/(staff)/layout.tsx`.
- Old single-page shell (`src/app/page.tsx`) still exists for legacy compatibility;
  to be removed screen-by-screen as P9-04D..H replicate the golden pattern.

## Next

- PLAN-P9-04D: Split the intake group into the next smallest Ready to Build task.
  P9-04D as written covers customer/vehicle lookup, complaint create, and
  attachment upload panels, which exceeds the build budget.

## Open carry-forward / known debt

- Old `src/app/work-queue.tsx`, `src/app/dashboard-summary.tsx`, and other `app/`
  component files are legacy; removed screen-by-screen as P9-04D..H finish.
- Badge labels show raw enum values (`IN_PROGRESS`, `HIGH`) - not localized; deferred.
- SLA state field still shows "Backend scoped" placeholder; typed SLA field pending
  backend exposure.
- E2E/visual/screenshot checks: Not Run in this environment (no live stack).

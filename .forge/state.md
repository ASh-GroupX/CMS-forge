# Current State

Status: Needs Review
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Next Task: P9-04B golden-screen review — accept or repair the real route + colored badges
Model Tier: PHASE-REVIEWER

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Phase 9 in progress. Arabic i18n fixed (P9-01), anti-mojibake gate live (P9-02),
  shadcn adopted via CLI (P9-03), P9-04A repair now complete.
- P9-04A repair delivered:
  1. `src/components/work-queue/index.tsx` — clean WorkQueue, no QueuePreviewState,
     colored Badge pills (severity/status), row hover, branded action link.
  2. `src/app/(staff)/layout.tsx` — real App Router staff route-group layout with
     session-based role nav and two-column shell.
  3. `src/app/(staff)/complaints/page.tsx` — real Server Component route; fetches
     `getStaffQueueItems`; renders WorkQueue. No searchParams preview switching.
  4. `src/i18n/staff-shell.ts` — added `unassigned` key (EN/AR).
  5. Tests: 124/124 pass; 7 new tests for the new route.
  6. typecheck, lint all clean.
- Old single-page shell (`src/app/page.tsx`) still exists for legacy compatibility;
  it keeps the old `work-queue.tsx` in `app/`. Both coexist during transition.
  P9-04B review will confirm the golden pattern before replication (P9-04C..H).

## Next

- P9-04B: Phase-reviewer acceptance gate for the new `(staff)/complaints` route.
  Review: structure (real App Router route), component location (`components/`),
  no QueuePreviewState, colored badges, clean typecheck/lint/test results.
  Accept → P9-04C (replicate pattern to next screen group).
  Repair → write repair task and keep state Blocked.

## Open carry-forward / known debt

- Old `src/app/work-queue.tsx` and single-page `page.tsx` shell are legacy; to be
  removed screen-by-screen as P9-04C..H replicate the golden pattern.
- SLA state field still shows "Backend scoped" placeholder; typed SLA field pending
  backend exposure.
- E2E/visual/screenshot checks: Not Run in this environment (no live stack).

# P9-04B Golden Screen Review — Accept or Repair the Real Route + Colored Badges

Status: Needs Review
Required model tier: PHASE-REVIEWER
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Risk: Medium

## What to review

The P9-04A repair delivered three new files:

1. **`src/app/(staff)/complaints/page.tsx`** — real App Router Server Component
   route. Fetches `getStaffQueueItems` (session cookie forwarded). Renders `WorkQueue`.
   No QueuePreviewState prop. No searchParams preview switching. Accepts optional
   `cookieHeader`/`fetchImpl` for testability.

2. **`src/app/(staff)/layout.tsx`** — staff route-group layout. Reads locale from
   `x-cms-locale` header (set by middleware). Fetches session principal for role-based
   nav. Renders sidebar + children. No workflow authority.

3. **`src/components/work-queue/index.tsx`** — clean WorkQueue component.
   `rows: ComplaintQueueItem[] | null` drives the three data states (null=error,
   []=empty, [...]= table). Colored Badge pills via design tokens. Row hover. Branded
   action link. No hardcoded strings; all i18n.

Plus: `src/i18n/staff-shell.ts` gained `unassigned` key (EN+AR); test file gained 7
new tests for the route.

## Check

1. Does the new route live at `app/(staff)/complaints/page.tsx` (real App Router path)?
2. Does the layout live at `app/(staff)/layout.tsx`?
3. Is WorkQueue in `components/work-queue/` (not `app/`)?
4. Is QueuePreviewState absent from the new WorkQueue?
5. Are badge colors from design tokens (not ad-hoc hex/rgb)?
6. Do all 124 tests pass? Is typecheck clean?
7. Is the pattern safe to replicate to P9-04C..H?

## Exit

- **Accept**: write the first P9-04C task and set state to `Ready to Build`.
- **Repair**: write the smallest repair and set state to `Needs Repair`.

# Repair Task: P9-04A repair - Golden screen must fix STRUCTURE and LOOK

Status: Needs Repair
Required model tier: BUILDER-STRONG
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Risk: Medium (this screen is the structural + visual reference every other screen copies)

## P9-04B golden-screen review decision: REPAIR

The work queue is clean and correct, but it is not yet a true golden screen on two axes:
1. STRUCTURE: it lives in the single-page `searchParams` / `PreviewState` shell, not a
   real App Router route. Replicating that across 7 screen groups spreads a bad
   architecture. See docs/ARCHITECTURE.md section 8 "Frontend structure".
2. LOOK: severity / SLA-state / status are plain text with no semantic color and weak
   hierarchy - it reads "functional," not "operational dashboard."

## Scope (the golden screen must be exemplary in BOTH; if > ~5 files, stop and PLAN-split)

- Move the queue to a REAL route under a staff route group, e.g.
  `app/(staff)/complaints/page.tsx`, with a shared staff `app/(staff)/layout.tsx` (nav shell).
- Move `WorkQueue` into `components/work-queue/`; DROP the `QueuePreviewState` prop and the
  `searchParams` preview switching for this screen - render loading / empty / error from the
  real `getStaffQueueItems` data path (Server Component fetch, session cookie forwarded).
- Visual polish with shadcn primitives: severity, SLA-state, and status as colored `Badge`
  pills (High=red, Medium=amber/neutral; Warning=amber, Overdue=red, On track=green),
  row hover, denser table spacing, clearer header/toolbar hierarchy.
- Keep backend authority: no role / branch / workflow / owner / state decided in React.

## Proof

- lint, typecheck, test:web, test:e2e -- ui-smoke, test:e2e -- accessibility, test:visual
- Render the real Next route, screenshot EN + AR, inspect: real data (no fallback rows),
  RTL correct, badges colored, the route actually works. Save to web-visual-review.

## Exit

- Re-enter P9-04B golden-screen review with the route + components/ structure + badges.
- Once accepted, P9-04C..H replicate THIS structure and look (per ARCHITECTURE section 8).
- Replace state.md (do not append).
# Current State

Status: Needs Repair
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Next Task: P9-04A repair - Golden screen: fix structure (real route + components/) and look (badges)
Model Tier: BUILDER-STRONG

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Phase 9 in progress. Arabic i18n fixed (P9-01), anti-mojibake gate live (P9-02),
  shadcn adopted via CLI (P9-03), work queue built as the golden screen (P9-04A),
  paused at the P9-04B golden-screen review.
- Review decision: REPAIR. The golden screen is correct/clean but (1) structurally
  it is still inside the single-page searchParams/PreviewState shell, not a real
  App Router route, and (2) visually it is plain (no colored badges, weak hierarchy).
- Frontend architecture finding: the staff app is one page.tsx switching screens via
  searchParams, with feature components dumped in app/ and PreviewState baked into
  production components - it does not follow App Router structure. docs/ARCHITECTURE.md
  section 8 now defines the required frontend structure (routes-only app/, components/
  <feature>/, no preview shells); the golden-screen repair establishes it.

## Next

- P9-04A repair: make the work queue a real route + components/ + real data + colored
  badges, then re-review at P9-04B. P9-04C..H then replicate that structure and look.

## Open carry-forward / known debt

- Frontend was under-architected (single-page preview shell); P9-04 now fixes the
  golden screen's structure so replication spreads the right pattern, not the wrong one.
- Queue SLA state is neutral copy until the backend exposes a typed SLA field.
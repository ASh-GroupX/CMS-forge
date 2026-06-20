# Current State

Status: Ready to Build
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Next Task: P9-04D-1 - Customer/vehicle lookup real route + component extraction
Model Tier: BUILDER-STANDARD

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Phase 9 in progress. P9-04C is complete.
- PLAN-P9-04D split the oversized intake group into three small build tasks:
  lookup, complaint create, and attachments.
- The next build task is P9-04D-1, covering only the customer/vehicle lookup panel
  as a real `(staff)/complaints/new` route plus `components/customer-vehicle-lookup/`.
- No staff customer/vehicle lookup API exists yet, so P9-04D-1 must not invent a
  fake API/client path.

## Next

- Build P9-04D-1 exactly as scoped in `.forge/next.md`.

## Open carry-forward / known debt

- Old `src/app/*` screen components remain legacy wrappers until retired
  screen-by-screen.
- Complaint create and attachment panels remain unsplit until P9-04D-2 and
  P9-04D-3.
- Badge labels show raw enum values (`IN_PROGRESS`, `HIGH`) - not localized;
  deferred.

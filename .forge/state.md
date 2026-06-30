# Current State

Status: P19A complete
Phase: Phase 19A - Vehicle manual/DMS provenance backend foundation
Next Task: P19A reviewer stop
Model Tier: GPT-5.5 Extra High

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- `.spec` is absent.
- Phase 17 is reviewed complete.
- Phase 18 is built; reviewer stop was skipped by user and must not be claimed as reviewed.
- P18A backend build and reviewer stop are complete.
- P18B duplicate warning UI foundation is built.
- P19A added backend provenance foundation for manual/local/DMS customer and
  vehicle source metadata, manual flags, vehicle-related marker, and vehicle
  data unavailable reason.
- Manual complaint creation remains non-blocking when DMS/provider data is
  absent; no live DMS integration or writeback was added.
- Vehicle-related complaints cannot close without a confirmed vehicle or a
  documented vehicle-data-unavailable reason.
- Staff-only create/detail/transition OpenAPI contracts were updated for the
  changed provenance fields.
- Portal tracking proof confirms provenance internals, DMS, VIN/plate-shaped
  data, audit internals, staff PII, and unrelated complaints are not exposed.

## Current Stop

Run a strict P19A reviewer stop. Do not start new implementation during review.

## Open Carry-Forward / Known Debt

- Phase 18 needs a reviewer pass before it can be called reviewed.
- No dedicated customer/vehicle correction or provenance update workflow exists;
  P19A recorded the gap instead of inventing a broad admin workflow.
- Advanced/AI matching is intentionally out of MVP scope.
- Portal attachment follow-up remains unstarted by Phase 16.

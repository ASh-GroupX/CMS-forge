# Current State

Status: P20C built, reviewer pending
Phase: P20C - Staff DMS Lookup UI
Next Task: P20C reviewer stop
Model Tier: GPT-5.5 Extra High

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- `.spec` is absent.
- Phase 17 is reviewed complete.
- Phase 18 is built, but not fully reviewed.
- P18A backend build and reviewer stop are complete.
- P18B duplicate warning UI foundation is built; its reviewer stop was skipped
  by user and must not be claimed reviewed.
- P19A is reviewed complete.
- P19B is built; its reviewer stop was skipped by user and must not be claimed
  reviewed.
- P19C is built; its reviewer stop was skipped by user and must not be claimed
  reviewed.
- Phase 19 must not be claimed fully reviewed because P19B and P19C were not
  reviewed.
- P20A is reviewed complete.
- P20B is reviewed complete. It added and reviewed a staff-only, read-only DMS
  lookup API route over the P20A adapter, protected by staff session plus
  `COMPLAINT_CREATE`, with OpenAPI contract coverage and integration tests.
- P20C is built, but not reviewed. It wires the staff DMS lookup API into intake
  and provenance correction UI through a same-origin proxy, keeps source labels
  visible, preserves manual fallback, and keeps DMS data read-only.
- P20C did not add live DMS provider calls, DMS writeback, provider credentials,
  customer portal exposure, schema migrations, persistence tables, or backend
  workflow/correction rule changes.

## Current Stop

Ready for P20C reviewer stop. Do not claim P20C reviewed until an actual
reviewer pass runs.

## Open Carry-Forward / Known Debt

- P18B needs a reviewer pass before it can be called reviewed.
- P19B needs a reviewer pass before it can be called reviewed.
- P19C needs a reviewer pass before it can be called reviewed.
- P20C reviewer stop, portal attachment follow-up, duplicate/related UX hardening,
  reports/business-fit closure, and final audit/stabilization remain open.
- Live DMS provider integration remains future work.
- DMS writeback remains out of MVP unless a separate approved change request
  authorizes it; writeback endpoints must remain absent or disabled.
- Portal attachment follow-up remains open.
- Advanced/AI matching is intentionally out of MVP scope.

# Current State

Status: Portal attachment follow-up reviewed complete
Phase: portal-attachment-follow-up-review
Next Task: Reports/business-fit gap closure
Model Tier: GPT-5.5 Extra High

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- `.spec` is absent.
- Phase 17 is reviewed complete.
- Phase 18 is reviewed complete. P18A and P18B are both built and reviewed.
- Phase 19 is reviewed complete. P19A, P19B, and P19C are built and reviewed.
- P20A is reviewed complete.
- P20B is reviewed complete. It added and reviewed a staff-only, read-only DMS
  lookup API route over the P20A adapter, protected by staff session plus
  `COMPLAINT_CREATE`, with OpenAPI contract coverage and integration tests.
- P20C is reviewed complete. It wires the staff DMS lookup API into intake and
  provenance correction UI through a same-origin proxy, keeps source labels
  visible, preserves manual fallback, and keeps DMS data read-only.
- The P18B/P19B/P19C catch-up review found no blockers and did not change
  product code.
- P20C and the catch-up review did not add live DMS provider calls, DMS
  writeback, provider credentials, customer portal exposure, schema migrations,
  persistence tables, or backend workflow/correction rule changes.
- Portal attachment follow-up is reviewed complete. It wires the existing
  verified backend portal attachment upload route into the tracking follow-up UI
  through a same-origin proxy/client, with localized policy, success, validation,
  and closed-complaint states.
- The portal attachment build/review did not add a portal download route, public
  link, download token, storage key exposure, schema migration, DMS work, or
  backend route rewrite.
- Duplicate/related complaint UX hardening is not currently re-opened: P18A
  related complaint linking and P18B duplicate warning UI foundation are built
  and reviewed, and the catch-up review found no blockers.

## Current Stop

Ready for reports/business-fit gap closure.

## Open Carry-Forward / Known Debt

- Reports/business-fit closure and final audit/stabilization remain open.
- If final audit finds a concrete duplicate/related complaint defect, open a
  scoped repair task; do not re-open duplicate UX work speculatively.
- Live DMS provider integration remains future work.
- DMS writeback remains out of MVP unless a separate approved change request
  authorizes it; writeback endpoints must remain absent or disabled.
- Advanced/AI matching is intentionally out of MVP scope.

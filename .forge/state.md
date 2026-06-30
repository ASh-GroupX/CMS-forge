# Current State

Status: MVP roadmap planned
Phase: Planning stop after P20A
Next Task: P20B - Staff DMS Lookup API
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
- P20A is reviewed complete. It added and reviewed the backend-only,
  read-oriented DMS lookup adapter foundation in the existing `integrations`
  module.
- The planning stop produced a single large MVP/business-fit roadmap split into
  commit-sized slices. No product code was changed.

## Current Stop

Ready for P20B implementation: staff-only, read-only DMS lookup API over the P20A
adapter.

## Open Carry-Forward / Known Debt

- P18B needs a reviewer pass before it can be called reviewed.
- P19B needs a reviewer pass before it can be called reviewed.
- P19C needs a reviewer pass before it can be called reviewed.
- P20B, P20C, portal attachment follow-up, duplicate/related UX hardening,
  reports/business-fit closure, and final audit/stabilization remain open.
- Live DMS provider integration remains future work.
- DMS writeback remains out of MVP unless a separate approved change request
  authorizes it; writeback endpoints must remain absent or disabled.
- Customer lookup UI wiring to the DMS adapter remains future work after P20B.
- Portal attachment follow-up remains open.
- Advanced/AI matching is intentionally out of MVP scope.

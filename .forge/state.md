# Current State

Status: P20A reviewed complete
Phase: P20A - DMS lookup adapter foundation
Next Task: Next-phase planning/audit stop
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
- P19A is reviewed complete. It added backend provenance fields for
  manual/local/DMS customer and vehicle source metadata, manual flags,
  vehicle-related marker, and vehicle data unavailable reason.
- P19B is built. It added a backend-only staff correction workflow for complaint
  customer/vehicle links and P19A provenance metadata.
- P19B reviewer stop was skipped by user. Do not claim P19B reviewed.
- P19C is built. It added staff complaint-detail provenance display and a
  correction form that posts changed fields with `expectedUpdatedAt` through a
  same-origin web proxy to the P19B backend endpoint.
- P19C reviewer stop was skipped by user. Do not claim P19C reviewed.
- Phase 19 must not be claimed fully reviewed because P19B and P19C were not
  reviewed.
- P20A is reviewed complete. It added and reviewed a backend-only, read-oriented
  DMS lookup adapter foundation in the existing `integrations` module with an
  in-memory provider, safe diagnostics, normalized manual-fallback outcomes, and
  focused integration tests.
- P20A did not add live DMS provider calls, DMS writeback, frontend DMS calls,
  customer portal exposure, schema migrations, OpenAPI routes, persistence
  tables, or portal attachment work.

## Current Stop

Next-phase planning/audit stop. Do not start implementation until the next scoped
build task is selected and written to `.forge/next.md`.

## Open Carry-Forward / Known Debt

- Phase 18 needs a reviewer pass before it can be called reviewed.
- P19B needs a reviewer pass before it can be called reviewed.
- P19C needs a reviewer pass before it can be called reviewed.
- Live DMS provider integration remains future work.
- DMS writeback remains out of MVP unless a separate approved change request
  authorizes it; writeback endpoints must remain absent or disabled.
- Customer lookup UI wiring to the DMS adapter remains future work.
- Portal attachment follow-up remains open.
- Advanced/AI matching is intentionally out of MVP scope.

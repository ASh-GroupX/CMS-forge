# Current State

Date: 2026-11-09
Status: Service appointment SMS settings and capacity-aware timeline deployed to production
Risk: Medium

- Admin can configure reminder enablement, message, sender number, and lead time.
  Test-mode SMS adapter only; live provider credentials/API are not configured and
  live delivery is not claimed.
- Calendar displays every appointment in a 15-minute slot, shows per-slot
  occupancy, and exposes Add only while backend slot/hour/day limits permit.
- Passed: npm test (78), npm run test:web (228), service-bookings API (24),
  notifications API (48), EN/AR SMS, catalog, and timeline browser proofs,
  lint, typecheck, OpenAPI, Prisma, migration SQL sanity, and diff check.
- Merged via waleed into production. Deployment workflow 42607361788 succeeded;
  public site and API health return HTTP 200 and X-CMS-Deployment
  716f6d5b6b703f71720b5ef46c055469f4946b5f.
- tmp/ and uploads/ remain untracked and were excluded from the release.

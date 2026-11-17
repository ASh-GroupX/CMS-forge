# Current State

Date: 2026-11-17
Status: Irbid periodic booking import deployed and completed
Risk: High

- The `اربد` worksheet A1:K59 contains 170 extracted bookings on 19 active dates.
  A private untracked artifact has 160 validated rows; 10 ambiguous rows remain
  isolated for manual review.
- The bilingual Admin Booking Settings importer can target `center_north` General
  with an exact 160-row batch. Amman import behavior remains unchanged.
- Original booking text becomes Notes, source mileage maps to the closest active
  periodic option, and the planner checks duplicates plus lane day/hour/slot
  capacity before using the existing authenticated create API.
- Passed actual batch validation, focused import tests 7/7, web 245/245,
  service-bookings API, typecheck, lint, OpenAPI, security, and diff check.
- Commit `b5c9681f9c4775e8dc6312fe0808d0a133bd99ee` is live in production. The
  signed-in Admin flow rendered correctly and created all 160 reviewed Irbid
  General appointments. Final readback: Created 160, Already imported 160,
  Ready 0, Needs review 0.
- The 10 ambiguous source rows remain in the untracked review artifact for manual
  handling; no values were invented and none of those rows were imported.
- Preserve untracked `outputs/`, `tmp/`, and `uploads/`.

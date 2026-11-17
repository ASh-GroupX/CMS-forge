# Current State

Date: 2026-11-17
Status: Irbid periodic booking import prepared; deployment and live import pending
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
- Deployment, rendered live UI review, and production creation are still pending.
- Preserve untracked `outputs/`, `tmp/`, and `uploads/`.

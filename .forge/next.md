# Service-center booking lanes

Status: Complete locally — awaiting user review before any commit or push
Date: 2026-11-14
Risk: High
SRS: REQ-BOOK-LANE-001, SR-BOOK-001, SR-BOOK-002, SR-BOOK-004, UI-DESIGN-001, METHOD-AUDIT-001, REQ-RBAC-001

Scope: Sequential slices: (1) add service-center-owned booking lanes, appointment lane identity, Admin-only audited configuration, and lane-level server capacity validation; (2) add bilingual Booking Settings management for lane name/order/active state and daily/hourly/slot limits; (3) require/select a valid lane when booking or rescheduling, return lane availability, and render selected service centers with their lanes side-by-side. Existing appointments migrate to a generated General lane. Do not use fake branches for lanes or move capacity authority into React.

Proof: Passed Prisma validate/generate and migration SQL sanity, focused service-bookings API 40/40, shell 232/232, OpenAPI, typecheck, lint, diff check, and booking timeline/Admin/brand/search browser proofs in EN/AR. Inspected desktop/mobile lane timeline and Admin screenshots. No commit, push, deployment, or production data change; preserve `tmp/` and `uploads/`.

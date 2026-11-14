# Booking form field alignment

Status: Complete — repository merge
Date: 2026-11-14
Risk: Medium
SRS: UI-DESIGN-001

Scope: Align the vehicle make and model in one row, then VIN and Maintenance Type in the next row of the appointment form. Stack on mobile and retain periodic mileage, booking rules, and the searchable model dropdown. No API, database, or booking authority change.

Proof: Passed booking suggestions and periodic mileage browser proof in EN desktop and AR mobile, screenshot inspection, accessibility scan, typecheck, lint, and diff check. Preserve `tmp/` and `uploads/`.

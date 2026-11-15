# Booking cards follow lane colors

Status: Complete locally — not pushed
Date: 2026-11-15
Risk: Medium
SRS: UI-DESIGN-001

Scope: Apply each Admin-configured booking lane color to appointment cards in the day timeline, including visible fill and border. Preserve status information and cancelled/no-show distinction, EN/AR, accessibility, and mobile layout. No API, database, Admin setting, or booking authority change.

Proof: Passed EN/AR timeline browser card-color assertions, cancelled status regression, scoped accessibility scan, screenshot inspection, typecheck, lint, and diff check. Preserve `tmp/` and `uploads/`.

# Unified searchable vehicle dropdown

Status: Complete — repository merge
Date: 2026-11-14
Risk: Medium
SRS: UI-DESIGN-001

Scope: Combine the separate car model search and select into one button. Opening it reveals a search field above filtered choices. Preserve model-first automatic make selection, make-first filtering, nested appointment dialog behavior, English and Arabic, and mobile layout. No API, database, or booking authority change.

Proof: Passed focused EN desktop/AR mobile browser behavior, screenshot inspection, accessibility scan, typecheck, lint, and diff check. Preserve `tmp/` and `uploads/`.

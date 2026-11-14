# Model-first vehicle search

Status: Complete locally — not pushed
Date: 2026-11-14
Risk: Medium
SRS: UI-DESIGN-001

Scope: Let booking staff search all active vehicle models before choosing a make. When a model is selected, populate its make automatically. Preserve the existing make-first flow, distinguish same-named models by make, keep the appointment dialog open, and support English LTR, Arabic RTL, keyboard access, empty results, and mobile layout. No API, database, booking authority, or production-data change.

Proof: Passed focused EN desktop/AR mobile browser behavior, screenshot inspection, serious/critical accessibility scan, shell 232/232, typecheck, lint, and diff check. `tmp/` and `uploads/` preserved.

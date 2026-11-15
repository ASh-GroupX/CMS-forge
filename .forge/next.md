# One-time Amman Notes appointment import

Status: Implemented locally — live import pending deployment
Date: 2026-11-15
Risk: High
SRS: REQ-BOOK-LANE-001, REQ-RBAC-001, UI-DESIGN-001

Scope: Prepare the 359 unflagged Amman Notes source entries for an authenticated Admin Hub import. Use the existing appointment API so server-side RBAC, lane capacity, and per-booking audit remain authoritative. Preserve source text and stable source keys; skip existing matches and report conflicts. Keep the 19 flagged entries and one stray fragment for human review. Do not commit customer data to Git.

Proof: Passed live read-only catalog/rule/lane preflight; 346/359 clear rows map to active catalog models, 13 held for manual catalog review. Passed 3 focused import tests, web shell 236/236, lint, web typecheck, OpenAPI check, security check, EN desktop/AR mobile browser preview, scoped Axe no serious/critical findings, screenshot inspection. The normal appointment API remains the only write path. Deployment and actual import Not Run at this point.

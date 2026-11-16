# Clean imported Amman Notes text

Status: Implemented locally; live cleanup pending deployment
Date: 2026-11-16
Risk: High
SRS: REQ-BOOK-LANE-001, REQ-RBAC-001, UI-DESIGN-001

Scope: Save only the exact original source text in Notes / Customer Requests for future imports. For the 356 existing imports, use the existing audited appointment PATCH endpoint to replace only notes after matching source key, lane, date, name, phone, and original source text. Preserve idempotency using exact original text and customer/date matching. Deploy, run cleanup, and verify all 356 live notes. Keep the 19 review-flagged entries separate. Do not commit customer data to Git.

Proof: Passed focused import tests 5/5, web shell 238/238, web TypeScript, lint, OpenAPI, security check, booking API 43/43, EN desktop/AR mobile browser preview with scoped Axe. Live cleanup pending this release.

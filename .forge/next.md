# Delegated QR settings access

Status: Complete locally — not pushed
Date: 2026-11-15
Risk: High
SRS: REQ-RBAC-001, REQ-ADMIN-001, UI-DESIGN-001

Scope: Allow an Admin Hub user manager to grant QR complaint intake settings access to a specific user of any role through Custom navigation rules. Keep Admin access, deny absent/preset-only grants at the API, audit denial, retain CSRF and settings audit, and align both QR pages and the Admin Hub tile.

Proof: Passed focused QR guard allowed/denied and CSRF metadata tests (included in Portal 32/32), RBAC 2/2, Admin 43/43, web shell 233/233, security check, typecheck, lint, OpenAPI check, EN desktop/AR mobile grant-form browser and scoped Axe with no serious/critical findings; screenshots inspected. The grant form browser proof initially needed an exact Select All locator, an explicit Playwright context, and a token-based contrast repair. No database migration or live user grant. Preserve `tmp/`, `uploads/`, and the prior workbook in `outputs/`.

# Booking lookup by customer name or phone

Status: Ready for release
Risk: Medium
SRS: UI-DESIGN-001, METHOD-API-001, REQ-RBAC-001

Implemented: English/Arabic booking search above the calendar using the existing protected appointment list. It matches customer name and normalized phone, shows status/date/time/center, limits visible results to 20, and opens the selected appointment after setting its day and branch. API load failure has a localized retry state. Browser proof, visual review, typecheck/lint/web/API/root/security/build, and independent review passed. Push to waleed and production under standing authorization and verify workflow/health/revision. Preserve `tmp/` and `uploads/`.

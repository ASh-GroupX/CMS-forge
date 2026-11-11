# Booking lookup by customer name or phone

Status: Complete
Risk: Medium
SRS: UI-DESIGN-001, METHOD-API-001, REQ-RBAC-001

Implemented and deployed: English/Arabic booking search above the calendar using the existing protected appointment list. It matches customer name and normalized phone, shows status/date/time/center, limits visible results to 20, and opens the selected appointment after setting its day and branch. API load failure has a localized retry state. Browser proof, visual review, all checks, independent review, production workflow, health, and revision passed. Preserve `tmp/` and `uploads/`. Next task awaits user direction.

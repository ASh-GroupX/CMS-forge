# Booking timeline polish and cancelled visibility

Status: Ready for release
Risk: Medium
SRS: UI-DESIGN-001, METHOD-API-001, REQ-AUDIT-001, REQ-RBAC-001, REQ-INT-DATA-001

Implemented: aligned Periodic Maintenance and mileage selectors; collapsed elapsed hours with a cancelled count and reopen control; removed forced empty-slot scrollbars; retained cancelled appointments in day, week, month, and mini-calendar while excluding them from capacity. EN/AR desktop/mobile browser proof and independent review passed. Release to waleed and production under standing authorization; verify workflow, health, and revision. Preserve `tmp/` and `uploads/`. User-specific booking requests map to UI-DESIGN-001 and METHOD-API-001; existing status update audit transaction gap remains recorded separately.

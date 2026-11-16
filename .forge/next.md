# Current maintenance type booking flow

Status: Complete; release pending
Date: 2026-11-16
Risk: High
SRS: SR-BOOK-004, REQ-BOOK-LANE-001, REQ-RBAC-001, UI-DESIGN-001, METHOD-AUDIT-001

Scope: The booking form uses active maintenance types from Admin Hub, shows each periodic subtype separately, requires mileage for each, and preserves the selected subtype and mileage on new bookings. Inactive types stay available in historical appointment snapshots and may be left unchanged while editing other details. New-install defaults use the five requested types. Existing appointment rows are untouched.

Proof: Passed booking API 45/45, web shell 243/243, EN desktop/AR mobile booking edit browser with no serious/critical Axe issues, lint, typecheck, OpenAPI. Security check passed. Live catalog/deactivation verification Not Run.

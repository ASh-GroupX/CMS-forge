# Current State

Date: 2026-11-16
Status: Maintenance type booking flow verified locally; release pending
Risk: High

- New bookings use the active maintenance type catalog without reinstating deactivated legacy defaults. All three periodic types expose mileage and preserve their distinct subtype in the appointment snapshot and display.
- Historical appointments retain saved maintenance names and may be edited without forcing a deactivated type back into an update. The five requested types are the defaults for an empty catalog; the live catalog's active flags remain Admin-controlled.
- Passed: booking API 45/45, web shell 243/243, EN desktop/AR mobile booking edit browser with no serious/critical Axe issues, lint, typecheck, OpenAPI. Security check passed. Live catalog/deactivation verification Not Run.
- Role permission audit and grouped descriptions are in progress in the working tree and are not part of this booking release.
- Preserve untracked `outputs/`, `tmp/`, and `uploads/`.

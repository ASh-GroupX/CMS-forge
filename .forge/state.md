# Current State

Date: 2026-11-15
Status: Amman Notes import UI implemented locally; live write pending
Risk: High

- The user authorized importing the 378 Amman Notes source entries, keeping 19 review-flagged rows for manual work. A 359-row JSON file is in `outputs/amman-notes-20261115/` for the Admin Booking Settings import tab; it is excluded from Git. Thirteen additional rows have no safe live catalog match and have a separate local CSV for manual review. One stray source fragment was not counted as a booking.
- The import tab uses existing appointment create/list APIs, server session, CSRF, lane validation, and per-booking transactional audit. It plans within the 9/hour, 3/slot, 70/day active Amman Notes lane, preserves exact source text and source key in notes, skips previously imported and same-hour phone matches, and stops on the first creation error so a rerun can resume safely.
- Passed: live read-only catalog/rules/lane preflight; 3 focused tests; web shell 236/236; lint, web typecheck, OpenAPI, security check; EN desktop/AR mobile browser preview with scoped Axe and screenshot inspection. Deployment and actual appointment creation Not Run yet. Preserve user `tmp/`, `uploads/`, and `outputs/`.
- QR delegated access release is merged on feature, `waleed`, and `production` through docs commit `a75face`; live UAT Not Verified.

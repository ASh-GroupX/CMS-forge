# Current State

Date: 2026-11-16
Status: Amman Notes imported; notes-only cleanup implemented locally, live run pending
Risk: High

- The user authorized importing the 378 Amman Notes source entries, keeping 19 review-flagged rows for manual work. A 359-row JSON file is in `outputs/amman-notes-20261115/` and excluded from Git. The latest live catalog maps all 359 clear rows. One stray source fragment was not counted as a booking.
- The import tab uses existing appointment create/list APIs, server session, CSRF, lane validation, and per-booking transactional audit. The new notes-only cleanup uses the audited appointment PATCH endpoint and matches each imported record to its source before changing just notes. Future imports save only the original source text; idempotency uses exact text and customer/date matching.
- The earlier live import stopped on the first POST because browser CSRF was absent; authenticated read confirmed zero source-marked appointments. The repair adds browser CSRF, refreshes the catalog, and puts request details under Notes / Customer Requests while retaining exact source text.
- Passed: 5 focused tests; web shell 238/238; lint, web typecheck, OpenAPI, security check; booking API 43/43; EN desktop/AR mobile browser preview with scoped Axe. CI/VPS deployment of `03f67b3` previously passed. Live Admin import created 356 appointments; cleanup and live verification pending. The 19 separately flagged entries remain for human review. Preserve user `tmp/`, `uploads/`, and `outputs/`.
- QR delegated access release is merged on feature, `waleed`, and `production` through docs commit `a75face`; live UAT Not Verified.

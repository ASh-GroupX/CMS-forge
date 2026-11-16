# Current State

Date: 2026-11-16
Status: Amman Notes clear-row import completed in production; review rows pending human correction
Risk: High

- The user authorized importing the 378 Amman Notes source entries, keeping 19 review-flagged rows for manual work. A 359-row JSON file is in `outputs/amman-notes-20261115/` and excluded from Git. The latest live catalog maps all 359 clear rows. One stray source fragment was not counted as a booking.
- The import tab uses existing appointment create/list APIs, server session, CSRF, lane validation, and per-booking transactional audit. It plans within the 9/hour, 3/slot, 70/day active Amman Notes lane, preserves exact source text and source key in notes, skips previously imported and same-hour phone matches, and stops on the first creation error so a rerun can resume safely.
- The earlier live import stopped on the first POST because browser CSRF was absent; authenticated read confirmed zero source-marked appointments. The repair adds browser CSRF, refreshes the catalog, and puts request details under Notes / Customer Requests while retaining exact source text.
- Passed: 4 focused tests; web shell 237/237; lint, web typecheck, OpenAPI, security check; booking API 43/43; EN desktop/AR mobile browser preview with scoped Axe. CI/VPS deployment of `03f67b3` passed. Live Admin import created 356 appointments, and a fresh preflight shows 356 already imported, 0 ready, 3 possible duplicates. Direct appointment response confirms Notes maintenance type and customer requests field. The 19 separately flagged entries include ambiguous phones, times, repeats, or models; the current catalog still lacks exact E7 and MNV and has only E30X for generic E30. Preserve user `tmp/`, `uploads/`, and `outputs/`.
- QR delegated access release is merged on feature, `waleed`, and `production` through docs commit `a75face`; live UAT Not Verified.

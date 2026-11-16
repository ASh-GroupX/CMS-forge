# One-time Amman Notes appointment import

Status: Live import complete; review-flagged source entries need human correction
Date: 2026-11-16
Risk: High
SRS: REQ-BOOK-LANE-001, REQ-RBAC-001, UI-DESIGN-001

Scope: Repair browser CSRF on the existing appointment API client, refresh the live car catalog before planning, map newly added models, and put all source details other than name and car model under Notes / Customer Requests. Deploy and import the clear 359-row batch, then verify live counts. Keep the 19 flagged entries for human review where details conflict or are missing. Do not commit customer data to Git.

Proof: Passed focused import tests 4/4, web shell 237/237, web TypeScript, lint, OpenAPI, security check, booking API 43/43, EN desktop/AR mobile browser preview with scoped Axe. CI and VPS deployment passed for `03f67b3`. Live Admin import created 356 bookings; reloading the source file found 356 already imported, 0 ready, and 3 possible duplicates. The 19 pre-flagged source entries need human correction or confirmation; their details are in the Review sheet of the local workbook.

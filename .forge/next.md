# One-time Amman Notes appointment import

Status: Ready for production retry
Date: 2026-11-16
Risk: High
SRS: REQ-BOOK-LANE-001, REQ-RBAC-001, UI-DESIGN-001

Scope: Repair browser CSRF on the existing appointment API client, refresh the live car catalog before planning, map newly added models, and put all source details other than name and car model under Notes / Customer Requests. Deploy and import the clear 359-row batch, then verify live counts. Keep the 19 flagged entries for human review where details conflict or are missing. Do not commit customer data to Git.

Proof: Passed focused import tests 4/4, web shell 237/237, web TypeScript, lint, OpenAPI, security check, booking API 43/43, EN desktop/AR mobile browser preview with scoped Axe. Latest live catalog maps 359/359 clear rows. Live import pending this release.

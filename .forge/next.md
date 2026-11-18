# Final Amman periodic booking import

Status: In Progress
Date: 2026-11-18
Risk: High
SRS: REQ-BOOK-LANE-001, REQ-RBAC-001, METHOD-AUDIT-001, UI-DESIGN-001

Import every reconciled periodic-maintenance booking from the final Amman
workbook into the Amman General lane. The reviewed batch has 128 unique rows,
including all five entries in the 19 November 10:00 source cell.

Scope:

1. Preserve each source entry exactly in Notes / Customer Requests.
2. Apply the user's explicit missing-data overrides: 5,000 km for the two
   six-month entries and JAC E10X for the single `jac ex10` entry.
3. Require the importer to accept exactly 128 rows, resolve active catalog
   models, select the closest periodic-maintenance mileage, and preflight
   duplicate and capacity conflicts before any write.
4. Deploy and inspect the signed-in live preflight. Obtain final user
   confirmation immediately before creating production appointments.
5. After creation, re-run the preflight and record created, already-imported,
   ready, and review counts.

Do not bypass the existing authenticated appointment API, server-session RBAC,
lane capacity, duplicate checks, or transactional audit. Preserve untracked
`outputs/`, `tmp/`, and `uploads/`; customer data must not enter Git.

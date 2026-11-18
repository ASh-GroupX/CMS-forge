# Current State

Date: 2026-11-18
Status: Booking timeline working-hour range complete; release pending
Risk: Medium

- The day timeline derives visible hour rows from the selected lanes' live
  availability. A 09:00–17:00 center now shows 09:00 through 16:45 and does not
  show the unusable 08:00 or 17:00 rows.
- Multiple selected centers use the earliest opening and latest closing; invalid
  or not-yet-loaded availability retains the existing safe 08:00–18:00 fallback.
- Current-time placement and collapsed past-hour counts use the same derived range.
- Passed web 247/247, typecheck, lint, security check, diff check, and the EN/AR
  booking timeline browser/accessibility proof. Desktop and mobile screenshots
  were inspected.
- The Amman periodic live preflight remains untouched: 69 ready, 59 already
  imported, 0 review. No production booking was created in this task.
- Preserve untracked `outputs/`, `tmp/`, and `uploads/`.

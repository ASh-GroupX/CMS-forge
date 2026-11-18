# Booking timeline working-hour range

Status: Complete
Date: 2026-11-18
Risk: Medium
SRS: REQ-BOOK-LANE-001, UI-DESIGN-001

Make the day timeline's visible start and end follow the working hours configured
for the selected service center instead of always rendering 08:00–18:00.

Scope:

1. Derive the visible hour rows from live slot-availability start/end values.
2. When several centers are selected, render the union from the earliest opening
   through the latest closing so no valid appointment time is hidden.
3. Keep the existing 08:00–18:00 fallback only while no valid availability is
   present, and keep past-hour/current-time behavior within the derived range.
4. Prove 09:00–17:00 renders 09:00 through 16:45 with no 08:00 or 17:00 row in
   English desktop and Arabic mobile.

The separate Amman periodic import remains paused at its confirmed live preflight:
69 ready, 59 already imported, 0 review. Do not create those appointments without
a new action-time confirmation.

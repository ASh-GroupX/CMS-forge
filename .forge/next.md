# Import Amman periodic maintenance bookings

Status: Implementation verified; live import pending deployment
Date: 2026-11-16
Risk: High
SRS: REQ-BOOK-LANE-001, REQ-RBAC-001, UI-DESIGN-001

Scope: Prepare the 62 mileage-bearing rows from workbook sheet `الصيانات  الدورية`, map each source mileage to the closest offered periodic mileage, save the original entry text in Notes / Customer Requests, and import to Amman General through the authenticated Admin booking settings flow. Hold two six-month entries lacking kilometres for review. Check existing bookings and lane capacity, deploy, import, and verify. Keep customer data out of Git.

Proof: Passed six focused import tests, web typecheck, lint, web test suite, booking API 43/43, OpenAPI check, security check, and EN/AR timeline browser proof. Live General lane and all 14 car-family catalog matches read from the signed-in service. Production import and fresh-read verification pending.

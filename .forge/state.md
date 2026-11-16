# Current State

Date: 2026-11-16
Status: Amman periodic maintenance import ready for deployment and live creation
Risk: High

- Workbook `الصيانات  الدورية` has 64 identifiable bookings from 19 November through 1 December 2026; later date rows contain no bookings. Sixty-two include kilometres and are prepared in ignored `outputs/amman-periodic-20261116/Amman_Periodic_Clear.json`. Two six-month entries without kilometres are in a separate ignored review file. No customer data is committed.
- Admin booking settings now offer a one-time periodic import into the active Amman General lane. The importer maps all 14 source car families to live active models, selects the closest offered periodic mileage, saves the original entry in Notes, checks duplicates and lane capacity, and uses the existing audited booking API with server-side permissions and CSRF.
- Passed: focused import tests 6/6, web TypeScript, lint, web tests, booking API 43/43, OpenAPI check, security check, and EN/AR timeline browser proof. Signed-in live API read confirmed General capacity 150/day, 7/hour, 2/slot and all 14 catalog model matches. Deployment, live import, and fresh-read verification remain.
- Prior Amman Notes import of 356 bookings and exact-text cleanup remain complete. Preserve user `tmp/`, `uploads/`, and `outputs/`.

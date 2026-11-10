# Booking sidebar: next three available slots

Status: In Progress
Risk: Medium
SRS: UI-DESIGN-001, SR-BOOK-002, METHOD-API-001

Phase 1 is complete and independently reviewed. Phase 2: add a Nest read endpoint for the next three bookable 15-minute slots across the selected active service center(s), using existing server availability rules and Amman time. Show the three choices under the capacity card with date, time, branch, remaining seats, loading/empty/error states, and a Book action that preselects the clicked slot. Keep the server authoritative and document the route in OpenAPI. Then phase 3 adds the maintenance dropdown and separately persisted periodic mileage. Final proof and release follow. Preserve `tmp/` and `uploads/`.

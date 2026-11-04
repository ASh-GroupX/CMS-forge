# Booking brand/model catalog release
Status: Verified for release; user authorized push/merge
Risk: Medium
SRS: SR-BOOK-001, SR-BOOK-004 (service-bookings MODULE.md), UI-DESIGN-001

Brand-first active model selection and admin required brand/model implemented.
CSV 128 rows -> 127 unique pairs / 12 brands. Existing catalog rows preserved.

Passed: full test 73/73 (89.64% lines), booking API 17/17, shell 228/228,
catalog checks 2/2, lint, typecheck, OpenAPI, production build, hydrated EN/AR
booking/admin form checks and inspected screenshots. PostgreSQL 18 isolated
runtime proof passed fresh import, repeat import, preexisting normalized model,
inactive preservation, Arabic label preservation, legacy models and booking FK.
The isolated proof server was stopped after verification.

Available independent review found no confirmed blocker; policy-named reviewer
unavailable, not claimed as passed. Production migration/deployment remain the
existing workflow's responsibility. User authorized waleed push and production
merge on 2026-11-04 after verification. Preserve unrelated tmp/uploads.

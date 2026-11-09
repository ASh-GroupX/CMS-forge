# Service booking improvements release
Status: Released; production deployment verified
Risk: Medium
SRS: REQ-BOOK-SMS-001, REQ-NOTIFY-001, METHOD-API-001, UI-DESIGN-001
Related module requirements: SR-BOOK-001, SR-BOOK-002

Release the Admin-configured service appointment SMS reminder (test adapter,
no live provider configured) and service booking day timeline fix. The timeline
shows all appointments in a 15-minute slot, displays slot capacity, and offers
Add only while backend slot, hourly, and daily limits permit. Preserve EN/AR,
audit, session-derived RBAC, OpenAPI, and transaction/outbox patterns.

User explicitly requested tests, push to `waleed`, and merge to `production`.
Keep tmp/ and uploads/ out of the release. Follow deployment validation and
report the live outcome; do not claim real SMS delivery without a provider.

Proof: focused API + notification suites, browser proofs, lint, typecheck,
OpenAPI, Prisma validation, migration SQL sanity, and diff checks all passed.
Production run 42607361788 succeeded; live site/API health report revision
716f6d5b6b703f71720b5ef46c055469f4946b5f. SMS remains test mode until a provider
is configured.

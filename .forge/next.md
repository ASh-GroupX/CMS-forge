# Reliable concurrent ticket and booking creation

Status: In Progress
Date: 2026-11-21
Risk: High
SRS: NFR-PERF-001, NFR-AVAIL-001, NFR-DATA-001, REQ-BOOK-LANE-001

Scope: Fix four small paths separately. First move staff ticket and booking creation to stable same-origin API calls instead of deployment-sensitive Server Actions. Second make concurrent creation reference numbers collision-safe and make retried requests return the original saved record. Third keep booking notification scheduling after commit from making a saved appointment appear failed. Fourth bound each production Prisma pool so API and worker connections cannot exhaust the database and block saves or backups. Preserve all existing records and attachments; use no destructive migration or import.

Proof: Focused ticket and booking API tests, concurrent and retry tests, web creation tests, production pool configuration test, typecheck, lint, OpenAPI, security, build, diff check. If released, verify fresh backup and before/after record counts, health, and source revision.

# External read-only system data API — release

Status: Ready for release
Risk: High
SRS: REQ-INT-DATA-001, REQ-RBAC-001, NFR-SEC-002, ARCH-API-001, ARCH-INTEGRATION-001, METHOD-API-001, METHOD-AUDIT-001

Phases 1–3 are implemented. The user authorized completion and production release after testing. Local PostgreSQL 18 proof applied all 56 migrations to an isolated UTF8 database, seeded records, started compiled Nest, and exercised staff key create/list/revoke, all four paginated feeds, branch and resource denial, revoked-key denial, page audits, and real transaction rollback. Required suites, build, security check, lint, typecheck, and OpenAPI check pass. Independent GPT-6 Sol source re-review: Accept With Conditions; this is not the repository's preferred named reviewer tier. The user previously selected GPT-5.6 Sol as the phase 1 judge, which is unavailable now.

Next: commit the tested diff, push to waleed, merge into production per the user's authorization, wait for deployment workflow migration/health checks, then verify the public revision and unauthenticated feed denial. A production data pull requires an administrator to issue a scoped key through the deployed endpoint; do not create a production key or expose customer data as a release smoke. Preserve tmp/ and uploads/.

# Deploy Dynamic Department Assignment Fix

Status: Implemented and verified locally
Required model tier: GPT-5.5 Extra High or equivalent
Risk: High (admin master data, RBAC, branch scope, production deployment)
SRS IDs: `REQ-ADMIN-001`, `REQ-RBAC-001`, `METHOD-AUDIT-001`,
`METHOD-API-001`, `METHOD-TEST-001`

## Task

Publish the audited top-level department creation path and the database-backed,
scope-eligible assignment selectors. Deploy to production, create a uniquely
named active top-level department through the admin workflow, and verify it is
immediately available in the English and Arabic task assignment interfaces.

## Required Gates

- Passed: admin department creation is permission-gated, CSRF-protected, active,
  global, and audited in the create transaction.
- Passed: assignment and task-board selectors query active database rows and
  include global departments while excluding other-branch rows for scoped staff.
- Passed: English and Arabic names are preserved and rendered from API data.
- Passed: lint, typecheck, root tests, focused API/web tests, visual proof, and
  canonical OpenAPI.
- Pending: publish, merge to `production`, and monitor deployment.
- Pending: authenticated production create-and-select verification.

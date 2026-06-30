# P20B Reviewer Stop - Staff DMS Lookup API

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: P20B Reviewer
Risk: High
SRS IDs: ARCH-INTEGRATION-001, ARCH-API-001, API-STANDARD-001, REQ-CUSTOMER-001, DMS-MAP-001, DATA-AUTO-001, NFR-SEC-002, RBAC-MATRIX-001

## Scoped Task

Review P20B only. Do not implement new product scope unless the review finds a
blocking defect that must be fixed before P20B can be accepted.

P20B added a staff-only, read-only DMS lookup route over the reviewed P20A
adapter foundation. Confirm the route is protected by server-session auth and
permission checks, returns only safe normalized lookup outcomes, preserves manual
fallback, documents OpenAPI, and does not add live provider calls, provider
credentials, frontend DMS calls, customer portal exposure, DMS writeback, schema
migrations, or persistence tables.

## Required Review Checks

- Inspect the P20B diff.
- Confirm no raw provider payload, credential, token, password, OTP, hash, DMS
  writeback, or portal exposure was introduced.
- Confirm P18B, P19B, and P19C are still not claimed reviewed.
- Run the proof commands below and record exact results in `.forge/evidence.md`.
- Update `.forge/state.md` and `.forge/next.md` after review.

## Required Proof

- `corepack pnpm test:api -- integrations`
- `corepack pnpm openapi:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm security:check`
- `git status --short`
- `git diff --check`

## Reviewer Rule

If P20B passes review, mark P20B reviewed complete and set next task to P20C
Staff DMS Lookup UI. If a blocking issue is found, keep P20B unreviewed and set
the next task to the smallest P20B fix slice.

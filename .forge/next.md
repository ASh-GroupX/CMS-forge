# P19A Reviewer Stop

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: Phase 19A - Vehicle Manual/DMS Provenance Backend Foundation
Risk: High
SRS IDs: REQ-CUSTOMER-001, DATA-AUTO-001, DMS-MAP-001, REQ-COMPLAINT-001, NFR-SEC-002, API-STANDARD-001

## Scoped Task

Strict review only. Review the P19A backend provenance foundation. Do not fix
product code unless the review blocks and Forge state/next files need to be
updated. Do not start new implementation.

## Review Focus

- Phase 18 reviewer stop was skipped by user and is recorded as
  "P18 built, review skipped by user"; Phase 18 must not be claimed reviewed.
- Manual complaint creation remains possible without DMS/provider data.
- No live DMS provider integration or DMS writeback was added.
- Customer/vehicle source metadata is safe and staff-only.
- Manual customer/vehicle flags and local/manual/DMS source distinctions persist
  correctly for supported inputs.
- Vehicle-related complaint close is rejected without confirmed vehicle or
  documented unavailable reason, before status/history/audit/side effects.
- Close is allowed when an unavailable reason is documented.
- Portal tracking/submission do not expose DMS identifiers, VIN, plate,
  provenance internals, staff PII, audit internals, or unrelated complaint data.
- Audit metadata remains safe and avoids secrets, identifiers, raw URLs, request
  bodies, VIN, plate, and DMS codes.
- The recorded correction/update workflow gap is acceptable; no broad admin
  workflow was invented.
- OpenAPI/canonical match changed staff-facing contracts only.

## Proof To Re-run

- `git status --short`
- `git diff --check`
- `corepack pnpm test:api -- complaints`
- `corepack pnpm test:api -- workflow`
- `corepack pnpm test:api -- portal.tracking`
- `corepack pnpm openapi:check`
- `corepack pnpm prisma:validate`
- `corepack pnpm --dir packages/database generate`
- `corepack pnpm db:migrate:test`
- `corepack pnpm typecheck`
- `corepack pnpm lint`

## If Blocked

- Update Forge only.
- Set `.forge/state.md` to Blocked.
- Set `.forge/next.md` to the smallest repair task.
- Findings first with file/line refs.

## If Clean

- Append reviewer evidence.
- Set `.forge/state.md` to P19A reviewed complete.
- Set `.forge/next.md` to next-phase planning/audit stop.

# Repair Task: REPAIR-F4-01C - Remove DMS Customer Number From Public Portal Submission

Status: Needs Repair
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 4 - Customer Portal
Returns to Verify Gate: F4-01C

## Why This Exists

`F4-01C` added `customerNumber` to `PortalComplaintRequest` and the public portal
DTO. In the complaint creation path this maps to the DMS customer-code field.
`REQ-PORTAL-001` forbids staff-only fields exposed to customers, and
`PORTAL-SEC-001` says DMS customer code is not accessible in the customer portal.

## Scope

- Remove `customerNumber` from the public portal submission request DTO/parser.
- Ensure `PortalService.submitComplaint` delegates with `customerNumber: null`.
- Remove `customerNumber` from the OpenAPI `PortalComplaintRequest` schema.
- Update portal/workflow tests so public portal submission proves no DMS customer
  number is accepted or forwarded.

## Out Of Scope

- No staff complaint creation changes.
- No OTP/session/tracking/timeline/UI/schema/provider work.
- No change to rate-limit behavior except keeping the existing portal route tests
  passing.

## Requirement IDs

- REQ-PORTAL-001
- PORTAL-SEC-001
- ARCH-WORKFLOW-001
- METHOD-AUDIT-001
- METHOD-TEST-001
- API-STANDARD-001

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- portal`
- `corepack pnpm test:api -- workflow`
- `corepack pnpm openapi:check`

## On Success

- Append repair evidence with the security self-check.
- Mark `REPAIR-F4-01C` done in `.forge/backlog.md`.
- Set `.forge/state.md` to `Needs Verify`.
- Write `VERIFY-F4-01C-REPAIR` to `.forge/next.md`.

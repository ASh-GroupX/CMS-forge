# Business Readiness Remediation - Slice 9

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: business-readiness-remediation
Risk: High
SRS IDs: `REQ-COMPLAINT-001`, `REQ-ATTACHMENT-001`, `PORTAL-SEC-001`, `REQ-RBAC-001`, `METHOD-AUDIT-001`, `UI-SCREEN-001`, `UI-DESIGN-001`

## Task

Implement Slice 9 from `docs/BUSINESS_READINESS_PLAN.md`: staff intake attachments.

## Scope

- Inspect staff complaint create flow, attachment service/routes, detail attachment retry UI, and existing attachment/create tests before editing.
- Upload selected staff intake files after complaint create succeeds.
- Show upload success and partial failure.
- Keep detail-page attachment upload as retry.
- Keep upload authorization, file validation, scan state, storage path generation, audit, RBAC, branch scope, and portal privacy backend-owned.
- If adding a dev download proxy is selected by existing plan context, keep it explicitly development-safe and backend-authorized.

## Proof

- `corepack pnpm test:api -- attachments`
- Staff intake screenshot with attached evidence.

## Stop When

- Staff-created complaint can upload intake attachments after create, report partial upload failure, and retry from the detail attachment panel.

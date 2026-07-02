# Business Readiness Remediation - Slice 8

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: business-readiness-remediation
Risk: High
SRS IDs: `REQ-SURVEY-001`, `REQ-COMPLAINT-004`, `REQ-NOTIFICATION-001`, `PORTAL-SEC-001`, `REQ-RBAC-001`, `METHOD-AUDIT-001`, `UI-SCREEN-001`, `UI-DESIGN-001`

## Task

Implement Slice 8 from `docs/BUSINESS_READINESS_PLAN.md`: closure survey.

## Scope

- Inspect current complaint close workflow, survey scheduling/service, portal survey UI, and existing survey/workflow tests before editing.
- Schedule a survey when a complaint closes.
- Send a tokenized survey link through the approved notification path.
- Wire portal survey submit and terminal token states.
- Show CSAT where authorized.
- Keep workflow state, survey token validation, notification enqueueing, audit, RBAC, and portal privacy backend-owned.

## Proof

- `corepack pnpm test:api -- surveys`
- Close-to-survey API or browser proof.

## Stop When

- UAT-008 can prove survey scheduled and submitted.

# Repair Task: REPAIR-PHASE-2-TRANSITION-BRANCH-SCOPE - Enforce Target Complaint Branch Scope Before Transitions

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 2 - Complaint Core Repair

## Why This Exists

PHASE-2-REVIEW found that `POST /complaints/:id/transitions` checks the request
`branchId` query against the server session, but does not verify that the target
complaint ID belongs to that scoped branch before calling `applyTransition`.
Phase 3 must not start until this branch-scope bypass is repaired.

## Scope

Fix only the complaint transition branch-scope path:

- `apps/api/src/modules/complaints/complaints.controller.ts`
- focused workflow API test(s) under `apps/api/test/workflow/`
- service/repository signatures only if needed for the smallest correct branch predicate

Do not implement Phase 3 SLA/workflow operations.

## Acceptance Criteria

- Non-admin staff transitions derive branch authority from the server session or guarded query, never client body data.
- A scoped staff user cannot transition a complaint outside their authorized branch.
- The denial happens before status update, status history, or WORKFLOW audit writes.
- Admin transition behavior remains valid.
- Existing same-transaction status history/audit behavior remains unchanged for allowed transitions.
- OpenAPI remains drift-free; update it only if the route contract changes.

## Requirement IDs

- REQ-RBAC-001
- RBAC-MATRIX-001
- ARCH-WORKFLOW-001
- WORKFLOW-MATRIX-001
- METHOD-AUDIT-001
- API-STANDARD-001
- METHOD-TEST-001

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- workflow`
- `corepack pnpm openapi:check`

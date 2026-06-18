# Build Task: F2-02C - Add Complaint Transition HTTP Route, RBAC/Branch-Scope Tests, And OpenAPI

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 2 - Complaint Core

## Why This Exists

`F2-02B` and `REPAIR-F2-02B` established the backend-owned complaint transition
service path and cleared the independent verify gate. The next smallest task is to
expose that path through an authenticated API route with server-session-derived
role and branch-scope enforcement.

## Scope

Implement only:

- `apps/api/src/modules/complaints/complaints.controller.ts`
- complaint transition DTO/response files only if needed
- `apps/api/src/modules/complaints/complaints.module.ts` only for required guard/provider wiring
- focused API tests for complaint transition HTTP behavior
- OpenAPI contract entries for the new route

Use the existing `ComplaintsService.applyTransition` path. Do not add complaint
creation, staff queues, jobs, notifications, SLA scheduling, portal behavior,
comments, attachments, DMS/external calls, UI, or unrelated workflow actions.

## Requirements

- Add a staff API route for complaint transitions, using backend-owned workflow
  authority. Suggested shape: `POST /complaints/:id/transitions`.
- Controller must be HTTP-only: validate request DTO, read role/branch authority
  from the server session/guards, and delegate to `ComplaintsService`.
- Roles and branch scope must not come from client input.
- Include at least one allowed API case and one denied RBAC or branch-scope case.
- Invalid workflow requests must return stable `COMPLAINT_INVALID_TRANSITION`.
- Successful transitions must use the existing same-transaction status/history/audit
  service path; do not duplicate workflow logic in the controller.
- Document the route, request, response, auth, and stable errors in OpenAPI.

## Verification Commands

Run and label honestly:

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- workflow`
- `corepack pnpm openapi:check`

## Requirement IDs

- ARCH-WORKFLOW-001
- WORKFLOW-MATRIX-001
- METHOD-AUDIT-001
- API-STANDARD-001
- REQ-COMPLAINT-001
- METHOD-TEST-001
- NFR-MAINT-001

## Output

Append `F2-02C` to `.forge/evidence.md` and `.forge/trust.md`.

If checks pass and more Phase 2 tasks remain, write the next in-phase task to
`.forge/next.md` and set `.forge/state.md` to `Ready to Build`. If checks fail,
set `.forge/state.md` to `Blocked`, write the smallest repair task, and escalate
the model tier.

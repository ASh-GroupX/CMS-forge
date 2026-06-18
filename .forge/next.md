# Repair Task: REPAIR-F2-02B - Validate Persisted Complaint Status Before Transition Writes

Status: Needs Repair
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 2 - Complaint Core

## Why This Exists

`VERIFY-F2-02B` found that `ComplaintsService.applyTransition` validates the
caller-provided `fromStatus`, but the repository updates the complaint by
`complaintId` only. A stale or mismatched persisted status could still produce a
status-history row and WORKFLOW audit entry that do not match the real current
state.

`F2-02C` will build the HTTP transition route directly on this persistence path,
so the persisted-state check belongs here before the gate can pass.

## Scope

Repair only:

- `apps/api/src/modules/complaints/complaints.service.ts`
- `apps/api/src/modules/complaints/complaints.repository.ts`
- `apps/api/test/workflow/transition-matrix.test.ts`
- generated complaint construction specs only if the service constructor or public
  input shape changes

Do not add HTTP routes, OpenAPI paths, DTO request parsing, UI, jobs,
notifications, SLA scheduling, portal behavior, comments, attachments, or external
side effects.

## Requirements

- `applyTransition` must not persist a transition based only on caller-provided
  `fromStatus`.
- Before writing complaint status, status history, or WORKFLOW audit, verify the
  complaint's persisted current status atomically in the transition path.
- If persisted status is stale or mismatched for the requested transition, reject
  with `COMPLAINT_INVALID_TRANSITION` and write no status history or audit entry.
- Preserve the existing pre-transaction denials for invalid matrix inputs and
  unauthorized roles where the current input shape allows it.
- Keep status update, status-history insert, and WORKFLOW audit write in one
  transaction for successful transitions.
- Keep the repair inside `F2-02B`; no route or OpenAPI behavior belongs here.

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

Append `REPAIR-F2-02B` to `.forge/evidence.md` and `.forge/trust.md`.

If checks pass, keep the Verify Gate active: set `.forge/state.md` to
`Needs Verify` and write a new `VERIFY-F2-02B-REPAIR` task to `.forge/next.md`.

# Verify Task: VERIFY-F2-02B-REPAIR - Complaint Transition Persistence Repair Gate

Status: Needs Verify
Required model tier: independent VERIFY
Risk: High
Phase: Phase 2 - Complaint Core

## Why This Exists

`REPAIR-F2-02B` repaired the stale persisted-status gap found in the original
`F2-02B` Verify Gate. `F2-02C` will build an HTTP transition route directly on top
of this persistence path, so an independent VERIFY must inspect and rerun proof
before AUTO PHASE continues.

## Scope

Review only. Do not implement new feature behavior unless the review result is
Repair/Redo and a separate repair task is written.

Inspect:

- `apps/api/src/modules/complaints/complaints.service.ts`
- `apps/api/src/modules/complaints/complaints.repository.ts`
- `apps/api/test/workflow/transition-matrix.test.ts`
- generated complaints specs if touched
- `.forge/evidence.md` and `.forge/trust.md` entries for `REPAIR-F2-02B`

## Verify Questions

- Did the repair stay inside `REPAIR-F2-02B` scope?
- Does every valid persisted transition still use the F2-02A validator first?
- Does the status write atomically check persisted current status before history and
  audit are written?
- Does stale or mismatched persisted status reject with `COMPLAINT_INVALID_TRANSITION`
  and avoid status history/audit writes?
- Are complaint status update, status history insert, and WORKFLOW audit write still
  in one transaction for successful transitions?
- Do invalid matrix inputs and unauthorized roles still avoid starting a transaction?
- Is there any route/OpenAPI/UI/job/notification/portal scope leak?

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

Append `VERIFY-F2-02B-REPAIR` to `.forge/trust.md` with:

- Builder honesty: Honest, Inflated, or Fabricated
- Code quality: Good, Acceptable, or Poor
- Recommendation: Accept, Repair, or Redo

On Accept, queue `F2-02C - Add Complaint Transition HTTP Route, RBAC/Branch-Scope
Tests, And OpenAPI` and set `.forge/state.md` to `Ready to Build`.

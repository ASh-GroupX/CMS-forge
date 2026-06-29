# P14B - WORKFLOW STATE REPAIR

Status: P14A complete; P14B ready
Required model tier: GPT-5 High or Opus 4.8 Max
Phase: Phase 14 - Workflow state repair
Risk: High
SRS IDs: ARCH-WORKFLOW-001, WORKFLOW-MATRIX-001, METHOD-AUDIT-001,
NFR-SEC-002, API-STANDARD-001

## Completed Proof

- Failed as expected before source fix: `corepack pnpm test:api -- workflow`
  (47/48; branch-scope denial audit target included a sensitive query).
- Passed: `corepack pnpm test:api -- workflow` (48/48).
- Passed: `corepack pnpm test:api -- audit` (8/8 plus append-only proof).
- Passed: `corepack pnpm test:api -- rbac` (2/2).
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `git diff --check` (line-ending warnings only).

## Next Scoped Task

Continue P14 workflow state repair. Read the SRS workflow IDs above, then
identify the smallest failing workflow state path before editing.

Keep P14 focused on backend workflow state behavior: transition validity,
history/audit consistency, branch/session authority, and stable API errors.

Recommended next seam: compare `WORKFLOW-MATRIX-001` required data and actor
authority against `applyTransition`, especially assigned-owner authority for
`IN_PROGRESS` update/resolve and required owner/route data for
`APPROVE_AND_ROUTE` / `ASSIGN_INVESTIGATION`.

## Carry-Forward

- P14A repaired unsafe branch-scope denial audit targets for workflow routes;
  RBAC/branch-scope denial audits now store the path, not raw query strings.
- Duplicate warning UI and related complaint linking remain out of scope.
- Vehicle manual/DMS provenance flags are still limited by the current vehicle
  schema and can be handled in a later data-model slice.
- SLA timers, report formulas, notification providers, portal OTP behavior, DMS
  live lookup, and UI work remain out of scope unless P14 explicitly cites them.

## Guardrails

- Backend owns authority; roles, permissions, and branch scope come from the
  server session.
- Do not accept role/branch/permission/workflow authority from client input.
- Every state change writes status history and audit in the same transaction.
- Side effects enqueue after commit.
- Audit logs are append-only and must not include passwords, OTPs, tokens,
  reset tokens, session tokens, hashes, secrets, credentials, provider secrets,
  attachment contents, or portal verification data.
- Customer portal routes must not expose internal comments, audit logs, DMS
  codes, staff PII, unrelated complaints, or attachments without verification.

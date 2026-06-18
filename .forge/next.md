# Next Task: VERIFY-F1-03A - Audit Log Search Endpoint

Status: Needs Verify
Required model tier: PLANNER
Risk: High
Phase: Phase 1 - Security Baseline

## Why This Exists

`F1-03A` is marked `Verify Gate: required`. Audit search is a high-risk security
surface, and `F1-03B` audit export builds directly on the same authorization and
privacy behavior.

## Scope

Independent VERIFY only. Do not implement new feature work.

Check:

- Did `GET /audit/logs` stay inside `F1-03A` scope?
- Are role and branch scope enforced from the server session, never client input?
- Are non-admin and cross-branch denials audited through `SECURITY` entries?
- Does audit search return only the allowed fields and redact secret-like metadata?
- Is the route documented in canonical OpenAPI?
- Did all required proof commands actually run and pass?
- Did app/package/tool source files stay under the 300-line budget?

## Requirement IDs

- REQ-AUDIT-001
- NFR-SEC-002
- METHOD-AUDIT-001
- METHOD-API-001
- METHOD-TEST-001
- API-STANDARD-001

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- audit`
- `corepack pnpm openapi:check`

## Output

Record Builder honesty, Code quality, and Recommendation in `.forge/trust.md`.

On `Accept`, queue `F1-03B - Audit Log Export Endpoint With Limits And Scope`
and set `.forge/state.md` to `Ready to Build`.

On `Repair` or `Redo`, set `.forge/state.md` to `Needs Repair` and write the
smallest repair task.

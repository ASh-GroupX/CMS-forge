# Next Task: VERIFY-F1-03A-REPAIR - Audit Search RBAC Repair

Status: Needs Verify
Required model tier: PLANNER
Risk: High
Phase: Phase 1 - Security Baseline

## Why This Exists

`REPAIR-F1-03A` fixed the RBAC mismatch found by `VERIFY-F1-03A`. Because `F1-03A`
is a high-risk verify gate and `F1-03B` builds on the same audit access surface, the
repair needs an independent VERIFY before Phase 1 continues.

## Scope

Independent VERIFY only. Do not implement new feature work.

Check:

- Does `GET /audit/logs` now match `RBAC-MATRIX-001` by allowing Admin only?
- Are Branch Manager and ordinary non-admin denials audited through `SECURITY` entries?
- Does `AuditSearchService.search` fail closed for non-admin direct calls?
- Did admin filtering, page-size clamp, safe response fields, metadata redaction, and invalid query behavior survive the repair?
- Is the route still documented in canonical OpenAPI?
- Did all required proof commands actually run and pass?
- Did app/package/tool source files stay under the 300-line budget?

## Requirement IDs

- REQ-AUDIT-001
- REQ-RBAC-001
- RBAC-MATRIX-001
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

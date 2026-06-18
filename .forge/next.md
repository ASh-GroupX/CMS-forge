# Next Task: F1-03B - Audit Log Export Endpoint With Limits And Scope

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 1 - Security Baseline

## Why This Exists

`F1-03A` (audit log search) is built, repaired to Admin-only, and independently
verified (see trust.md VERIFY-F1-03A-REPAIR). The next audit surface is **export**:
an authorized admin can export audit log entries with the same access rule and the
same scope/filter parity as the search view, under a configured size limit, and the
export action is itself audited.

## Scope

Add an Admin-only audit log export route, reusing the existing audit search filter
parsing, repository, safe-field mapping, and metadata redaction. Use the canonical
RBAC/guard/audit patterns in `docs/ARCHITECTURE.md` §6 — do not invent new mechanisms.

- Add `GET /audit/logs/export` guarded by `SessionAuthGuard` + `RbacGuard` +
  `@Roles('ADMIN')`. Per `RBAC-MATRIX-001` "Export audit log": Admin = Yes;
  Management Read-Only = "No by default" (defer until a permission model exists);
  all other roles = No. Fail closed in the service for non-admin direct calls.
- Apply the **same filters as the search view** (`RBAC-MATRIX-001` AC2: export must use
  the same scope filters as its matching screen). Reuse `parseAuditSearchQuery`.
- Enforce a **configured export row cap** (define and document a constant, e.g.
  `MAX_EXPORT_ROWS`); never stream an unbounded dump. Reuse the safe response fields and
  `redact()` so secret-like metadata keys cannot leak into the export.
- Return a downloadable response (e.g. CSV or JSON) with an appropriate
  `Content-Type` and `Content-Disposition: attachment` header.
- **Audit the export action itself** (exporting audit data is sensitive): write one
  audit entry recording the admin actor, correlation/IP/UA context, and the applied
  filters — never any secret values.
- Document `GET /audit/logs/export` (and any new response schema) in the canonical
  OpenAPI contract; `openapi:check` must stay drift-enforced.

## Scope Guard

Keep to ~1–5 source files plus tests, reusing `audit.service`/`audit.repository`. If a
CSV/stream formatter or the export-audit wiring pushes this past the budget, **stop and
replan**: rewrite this file as `PLAN-F1-03B` and set `.forge/state.md` to
`Ready to Plan`. Do not ship a large diff.

## Out Of Scope

- Audit append-only DB-level enforcement (`F1-03C`).
- Management Read-Only configurable audit access (needs a permission model; not in MVP yet).
- Login rate limiting / CSRF (`F1-06`), error-shape surface (`F1-04`), golden CRUD (`F1-05`), and any UI.

## Requirement IDs

- REQ-AUDIT-001
- REQ-RBAC-001
- RBAC-MATRIX-001
- NFR-SEC-002
- METHOD-AUDIT-001
- METHOD-API-001
- METHOD-TEST-001
- API-STANDARD-001

## Acceptance Criteria

- Export is Admin-only at both the HTTP guard and the service (fail closed); a denied
  non-admin attempt returns `RBAC_FORBIDDEN` and writes a `SECURITY` audit entry.
- Export applies the same filters as the search view and enforces the documented row cap.
- Exported rows expose only the safe response fields with metadata redaction applied.
- The export action is audit logged with actor + context and no secret values.
- `GET /audit/logs/export` is documented in OpenAPI; `openapi:check` passes.
- At least one allowed (admin) and one denied (non-admin) case is tested, plus limit
  enforcement, redaction, and the export-audit entry.
- All required proof commands pass and actually ran.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- audit`
- `corepack pnpm openapi:check`

## Evidence To Record

This is a High-risk task: record the `policy.md` Security Self-Check in
`.forge/evidence.md` (citing where each item is enforced/tested), update
`.forge/trust.md`, mark `F1-03B` done in `.forge/backlog.md`, and update
`.forge/next.md` + `.forge/state.md` per the BUILD rules. F1-03B is **not** a
`Verify Gate`; on success AUTO PHASE continues to `F1-03C`.

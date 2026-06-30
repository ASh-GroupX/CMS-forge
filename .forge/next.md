# Reports/Business-Fit Gap Closure

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: reports-business-fit-closure
Risk: High
SRS IDs: REQ-REPORT-001, REPORT-MATRIX-001, REQ-AUDIT-001, NFR-SEC-002, API-STANDARD-001, UI-SCREEN-001, UI-DESIGN-001

## Scoped Task

Close the remaining reports/business-fit gap after P17, P20, and portal
attachment completion. Start by reconciling current code and evidence against
`REPORT-MATRIX-001` RPT-001 through RPT-017, then implement the smallest
coherent closure that is still needed. If a report is too broad for this slice,
record an explicit defer/needs-signed-scope note in Forge instead of building a
wide diff.

## Scope

- Reconcile the current reports backend, web reports dashboard/export surface,
  audit export surface, DMS lookup behavior, notification delivery evidence, and
  survey/compensation status against RPT-001 through RPT-017.
- Keep report reads/exports scoped by server-session RBAC and branch scope.
- Preserve row limits and safe export audit metadata.
- Prefer existing report module, audit module, notification module, and DMS
  adapter patterns; do not add a new reporting framework.
- Add or update focused tests only for concrete gaps repaired in this slice.
- Update `.forge/evidence.md`, `.forge/state.md`, and `.forge/next.md` at slice
  end.

## Likely Files

- `apps/api/src/modules/reports/**`
- `apps/api/test/reports/**`
- `apps/web/src/components/reports-dashboard/**`
- `apps/web/src/lib/staff-reports-api.ts`
- `apps/web/src/i18n/staff-reports-dashboard.ts`
- `apps/web/test/api-client/**`
- `apps/web/test/shell/**`
- `tools/web-proof-cases.mjs`
- `.forge/next.md`
- `.forge/state.md`
- `.forge/evidence.md`

## Skipped Work

- No DMS writeback, live DMS provider integration, provider credentials, or
  frontend provider calls.
- No customer portal report exposure.
- No unbounded exports or export of sensitive row-level fields without an
  existing explicit permission.
- No speculative report warehouse, BI framework, async export worker, or schema
  migration unless the reconciliation proves it is required and the slice is
  replanned.
- No duplicate/related complaint UX work unless a concrete blocker is found.

## Required Proof

- `git status --short`
- `git diff --check`
- `corepack pnpm test:api -- reports`
- `corepack pnpm test:api -- audit`
- `corepack pnpm test:web -- api-client`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm openapi:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm security:check`
- If any web reports UI changes are made: `corepack pnpm test:visual`,
  `corepack pnpm test:e2e -- accessibility`, and
  `corepack pnpm web:visual-review`.

## Reviewer Rule

Stop for a reviewer commit after this implementation slice. The reviewer must
verify RPT-001 through RPT-017 delivery/defer status, RBAC/branch scope, export
limits, OpenAPI drift, portal privacy, and report/audit metadata safety before
reports/business-fit closure can be called reviewed complete.

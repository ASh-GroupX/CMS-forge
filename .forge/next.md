# Reports/Business-Fit Gap Closure Reviewer Stop

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: reports-business-fit-closure-review
Risk: High
SRS IDs: REQ-REPORT-001, REPORT-MATRIX-001, REQ-AUDIT-001, NFR-SEC-002, API-STANDARD-001, UI-SCREEN-001, UI-DESIGN-001

## Scoped Task

Review the reports/business-fit gap closure build. Review already-built code
only. Fix only blocking reviewer findings inside this slice; if no blockers are
found, update Forge only.

## Scope

- Confirm `GET /reports/catalog` is staff-session guarded with `REPORT_VIEW`,
  RBAC, and branch-scope guard coverage.
- Confirm the report catalog includes RPT-001 through RPT-017 exactly once with
  required filters, required outputs, delivered/deferred status, implemented
  notes, deferred scope, and `signoffRequired` for every deferral.
- Confirm delivered statuses are honest: RPT-001, RPT-004, RPT-013, and RPT-017
  only.
- Confirm all other report matrix gaps are explicit signed-scope deferrals and
  not claimed as fully delivered.
- Confirm no report response/export exposes customer phone/email, VIN, plate,
  DMS codes, provider credentials, portal data, storage keys, public URLs,
  staff PII, tokens, passwords, OTPs, or arbitrary audit metadata.
- Confirm OpenAPI documents `/reports/catalog` and the catalog response schemas.
- Confirm no web UI changed; visual/accessibility proof is not required unless a
  reviewer blocker changes the web UI.
- Update `.forge/evidence.md`, `.forge/state.md`, and `.forge/next.md` at review
  end.

## Likely Files

- `apps/api/src/modules/reports/report-matrix.ts`
- `apps/api/src/modules/reports/reports.controller.ts`
- `apps/api/src/modules/reports/reports.service.ts`
- `apps/api/test/reports/dashboard-summary.test.ts`
- `packages/contracts/openapi.json`
- `tools/openapi-canonical.json`
- `.forge/next.md`
- `.forge/state.md`
- `.forge/evidence.md`

## Skipped Work

- No new product feature work beyond reviewer blocker repair.
- No specialized implementation for deferred reports.
- No DMS telemetry persistence, live DMS provider, DMS writeback, provider
  credentials, notification aggregate report, CSAT report, compensation report,
  report warehouse, async export worker, schema migration, or customer portal
  report exposure.
- No web reports UI work unless required to fix a blocker.

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
- If reviewer changes web UI: `corepack pnpm test:visual`,
  `corepack pnpm test:e2e -- accessibility`, and
  `corepack pnpm web:visual-review`.

## Reviewer Rule

If review passes, record reports/business-fit closure as reviewed complete and
move to final SRS/business-fit audit and stabilization. If a blocker is found,
repair it in the smallest reviewer commit and rerun affected proof plus
`typecheck`, `lint`, `openapi:check`, and `security:check`.
# Final SRS/Business-Fit Audit And Stabilization

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: final-srs-business-fit-audit
Risk: High
SRS IDs: MVP-BUSINESS-FIT-001, REQ-COMPLAINT-001, REQ-COMPLAINT-002, REQ-COMPLAINT-003, REQ-COMPLAINT-004, REQ-PORTAL-001, REQ-PORTAL-002, REQ-PORTAL-003, REQ-ATTACH-001, REQ-DMS-001, DMS-MVP-001, REQ-REPORT-001, REPORT-MATRIX-001, REQ-AUDIT-001, NFR-SEC-002, API-STANDARD-001, UI-SCREEN-001, UI-DESIGN-001

## Scoped Task

Run the final SRS/business-fit audit from current state to MVP closure. Prefer
review and stabilization over feature expansion. Fix only concrete blockers that
prevent MVP/business-fit completion and can stay small and coherent; otherwise
record the gap and stop with a scoped follow-up.

## Scope

- Re-read Forge and the relevant SRS requirements before auditing.
- Reconcile `.forge/evidence.md`, `.forge/state.md`, and current code so skipped
  reviews are not claimed unless an actual reviewer pass ran.
- Confirm P17, P18A/P18B, P19A/P19B/P19C, P20A/P20B/P20C, portal attachment
  follow-up, and reports/business-fit closure are all either reviewed complete
  or honestly marked.
- Confirm DMS work is read-only lookup/import only and no DMS writeback route or
  frontend credential/provider secret exists.
- Confirm portal privacy still holds: tracking requires verified session, portal
  follow-up attachments do not expose download tokens/public links/storage keys,
  and portal responses do not expose internal comments, audit logs, DMS codes,
  staff PII, or unrelated complaints.
- Confirm duplicate/related complaint UX is not still required unless a concrete
  defect is found.
- Confirm report/business-fit gaps are either delivered or explicitly signed-scope
  deferred in the report catalog.
- Confirm all public/frontend routes are documented in OpenAPI and the canonical
  OpenAPI check passes.
- Run the full proof set below and update `.forge/evidence.md`, `.forge/state.md`,
  and `.forge/next.md` at audit end.

## Likely Files

- `.forge/next.md`
- `.forge/state.md`
- `.forge/evidence.md`
- `docs/CMS_AUTO_SRS.md`
- `docs/ARCHITECTURE.md`
- `apps/api/src/modules/**`
- `apps/api/test/**`
- `apps/web/src/**`
- `packages/contracts/openapi.json`
- `tools/openapi-canonical.json`

## Skipped Work

- No speculative feature expansion.
- No DMS writeback, live DMS provider credentials, provider calls from frontend,
  or frontend secrets.
- No portal download route, public attachment links, storage key exposure, or
  unverified tracking by reference number alone.
- No specialized implementation for report catalog entries currently marked as
  signed-scope deferrals unless the audit proves a small blocker must be fixed.
- No advanced/AI matching work.

## Required Proof

- `git status --short`
- `git diff --check`
- `corepack pnpm test:api -- complaints`
- `corepack pnpm test:api -- portal.tracking`
- `corepack pnpm test:api -- attachments`
- `corepack pnpm test:api -- integrations`
- `corepack pnpm test:api -- reports`
- `corepack pnpm test:api -- audit`
- `corepack pnpm test:web -- api-client`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm test:visual`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm web:visual-review`
- `corepack pnpm openapi:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm security:check`

## Reviewer Rule

This is the final audit stop. If all required proof passes and no blocker remains,
record MVP/business-fit audit complete and set `.forge/next.md` to a done state.
If any blocker remains, make the smallest stabilization fix only when it fits this
slice; otherwise set state to blocked with the exact follow-up task and do not
claim final completion.

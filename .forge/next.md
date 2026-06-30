# P20C Reviewer Stop - Staff DMS Lookup UI

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: P20C-review
Risk: High
SRS IDs: REQ-CUSTOMER-001, DMS-MAP-001, DATA-AUTO-001, UI-SCREEN-001, UI-DESIGN-001, NFR-SEC-002, API-STANDARD-001

## Scoped Task

Review only the P20C build commit for staff DMS lookup UI wiring in intake and
provenance correction. Do not implement new product behavior unless the review
finds a blocker that must be repaired inside the reviewer slice.

The review must confirm the UI searches by phone, customer number, VIN, or name;
renders match, multiple-match, not-found, provider-down, disabled, validation,
denied/error, selected, and manual fallback states; preserves DMS/local/manual
source labels; and keeps all DMS access behind the staff backend/proxy boundary.

## Scope

- Inspect the P20C diff only.
- Confirm the same-origin proxy forwards only lookup fields and the staff session
  cookie.
- Confirm frontend code contains no provider credentials, direct DMS provider
  call, DMS writeback, workflow authority, raw provider payload, or portal
  exposure.
- Confirm correction still submits through the P19B backend correction contract
  with reason and optimistic concurrency.
- Confirm visual/accessibility proof cases cover English and Arabic lookup UI
  appearances.
- Update `.forge/evidence.md`, `.forge/state.md`, and `.forge/next.md` at review
  end.

## Likely Files

- `apps/web/src/app/api/integrations/dms/customer-vehicle/route.ts`
- `apps/web/src/app/(staff)/complaints/**`
- `apps/web/src/app/page.tsx`
- `apps/web/src/components/complaint-intake-workspace/**`
- `apps/web/src/components/customer-vehicle-lookup/**`
- `apps/web/src/components/complaint-create-form/**`
- `apps/web/src/components/complaint-detail-workspace/**`
- `apps/web/src/lib/staff-complaints-api.ts`
- `apps/web/src/i18n/**`
- `apps/web/test/**`
- `tools/web-proof-cases.mjs`
- `.forge/next.md`
- `.forge/state.md`
- `.forge/evidence.md`

## Skipped Work

- No live DMS provider, provider SDK, provider credentials, or direct browser DMS
  call.
- No DMS writeback.
- No customer portal exposure.
- No backend workflow/correction rule changes unless the P20C reviewer finds a
  blocker.
- No P18B/P19B/P19C reviewer catch-up inside this reviewer commit.

## Required Proof

- `git show --stat --oneline HEAD`
- `git status --short`
- `git diff --check`
- `corepack pnpm test:web -- api-client`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test:visual`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm web:visual-review`
- `corepack pnpm openapi:check`
- `corepack pnpm security:check`

## Reviewer Rule

If the review passes, record P20C as reviewed complete and set the next task to
P18B/P19B/P19C reviewer catch-up. If the user explicitly skips this review,
record P20C as built but not reviewed and move next only with that caveat.

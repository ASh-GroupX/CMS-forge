# P18B/P19B/P19C Reviewer Catch-Up

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: review-catch-up
Risk: High
SRS IDs: REQ-COMPLAINT-003, REQ-CUSTOMER-001, DATA-AUTO-001, REQ-RESOLUTION-001, REQ-AUDIT-001, DMS-MAP-001, API-STANDARD-001, NFR-SEC-002, UI-SCREEN-001, UI-DESIGN-001

## Scoped Task

Run the skipped reviewer passes for P18B, P19B, and P19C. Review the already
built code only. Do not claim any skipped review as reviewed until this pass
actually inspects and proves it.

Review order:

1. P18B - Duplicate warning UI foundation.
2. P19B - Staff customer/vehicle correction workflow backend.
3. P19C - Staff customer/vehicle correction UI.

## Scope

- Locate the relevant P18B, P19B, and P19C commits/evidence before reviewing.
- Confirm P18B keeps duplicate/related complaint UI safe-field only,
  non-destructive, staff-scoped, and portal-private.
- Confirm P19B correction backend keeps server-session RBAC/branch authority,
  CSRF, optimistic concurrency, same-transaction audit, safe audit metadata, and
  OpenAPI coverage.
- Confirm P19C correction UI keeps backend authority server-side, submits only
  through the P19B contract, preserves conflict/denied states, and exposes no
  portal/private/DMS-provider data.
- Fix only blocking reviewer findings that are inside the reviewed slice
  contracts. If no blockers are found, update Forge only.
- Update `.forge/evidence.md`, `.forge/state.md`, and `.forge/next.md` at review
  end.

## Likely Files

- `apps/api/src/modules/complaints/**`
- `apps/api/test/complaints*.test.ts`
- `apps/web/src/app/(staff)/complaints/**`
- `apps/web/src/app/api/complaints/**`
- `apps/web/src/components/complaint-detail-workspace/**`
- `apps/web/src/i18n/**`
- `apps/web/src/lib/staff-complaint-relations-api.ts`
- `apps/web/src/lib/staff-complaints-api.ts`
- `apps/web/test/**`
- `docs/openapi.yaml` and `packages/contracts/openapi.json` if P19B review
  requires contract inspection
- `.forge/next.md`
- `.forge/state.md`
- `.forge/evidence.md`

## Skipped Work

- No new product feature work.
- No portal attachment follow-up.
- No duplicate/related UX hardening beyond reviewer blocker repair.
- No reports/business-fit changes.
- No live DMS provider, provider SDK, provider credentials, direct browser DMS
  call, DMS writeback, schema migration, or persistence table.
- No final SRS/business-fit audit.

## Required Proof

- `git log --oneline --grep="P18B\\|P19B\\|P19C"`
- `git status --short`
- `git diff --check`
- `corepack pnpm test:api -- complaints`
- `corepack pnpm test:api -- workflow`
- `corepack pnpm test:api -- portal.tracking`
- `corepack pnpm test:web -- api-client`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm test:visual`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm web:visual-review`
- `corepack pnpm openapi:check`
- `corepack pnpm prisma:validate`
- `corepack pnpm --dir packages/database generate`
- `corepack pnpm db:migrate:test`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm security:check`

## Reviewer Rule

If all three reviews pass, record P18B, P19B, and P19C as reviewed complete and
set the next task to portal attachment follow-up completion. If any review finds
a blocker, repair it in the smallest reviewer commit possible and rerun the
affected proof commands plus `typecheck`, `lint`, `openapi:check`, and
`security:check` as applicable.

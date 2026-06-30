# Portal Attachment Follow-Up Reviewer Stop

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: portal-attachment-follow-up-review
Risk: High
SRS IDs: REQ-PORTAL-002, REQ-FILES-001, PORTAL-SEC-001, REQ-AUDIT-001, API-STANDARD-001, NFR-SEC-002, UI-SCREEN-001, UI-DESIGN-001

## Scoped Task

Review the portal attachment follow-up build. Review already-built code only.
Fix only blocking reviewer findings inside this slice; if no blockers are found,
update Forge only.

## Scope

- Confirm portal attachment upload is reachable only after verified portal
  tracking/session access, never from reference number alone.
- Confirm closed or rejected complaints cannot receive portal follow-up text or
  attachments.
- Confirm the UI sends only the existing attachment upload contract and the web
  proxy forwards only public portal headers, not staff cookies, CSRF, role,
  branch, actor, or workflow authority.
- Confirm the portal still exposes no internal comments, audit entries, staff
  PII, DMS codes, unrelated complaints, storage keys, public URLs, download
  tokens, provider fields, or credentials.
- Confirm attachment limits and blocked executable behavior remain backend-owned
  and tested.
- Confirm localized English/Arabic visual and accessibility proof covers the
  attachment follow-up state.
- Update `.forge/evidence.md`, `.forge/state.md`, and `.forge/next.md` at review
  end.

## Likely Files

- `apps/web/src/app/api/portal/[...path]/route.ts`
- `apps/web/src/components/portal-tracking/**`
- `apps/web/src/i18n/portal-tracking.ts`
- `apps/web/src/lib/portal-tracking-api.ts`
- `apps/web/test/api-client/portal-tracking-api.test.ts`
- `apps/web/test/shell/shell.test.ts`
- `tools/web-proof-cases.mjs`
- `apps/api/src/modules/attachments/**`
- `apps/api/src/modules/portal/**`
- `.forge/next.md`
- `.forge/state.md`
- `.forge/evidence.md`

## Skipped Work

- No new product feature work beyond reviewer blocker repair.
- No staff attachment management rewrite.
- No portal attachment download route, public link, download token, or storage
  key exposure.
- No malware provider integration, schema migration, DMS work, duplicate UX
  hardening, reports work, or final audit work.

## Required Proof

- `git status --short`
- `git diff --check`
- `corepack pnpm test:api -- attachments`
- `corepack pnpm test:api -- portal.tracking`
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

If review passes, record portal attachment follow-up as reviewed complete and set
the next task to duplicate/related complaint UX hardening only if still required
by current Forge/SRS evidence; otherwise move to remaining report/business-fit
closure. If a blocker is found, repair it in the smallest reviewer commit and
rerun affected proof plus `typecheck`, `lint`, `openapi:check`, and
`security:check`.
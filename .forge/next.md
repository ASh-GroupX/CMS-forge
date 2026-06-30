# Portal Attachment Follow-Up Completion

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: portal-attachment-follow-up
Risk: High
SRS IDs: REQ-PORTAL-002, REQ-FILES-001, PORTAL-SEC-001, REQ-AUDIT-001, API-STANDARD-001, NFR-SEC-002, UI-SCREEN-001, UI-DESIGN-001

## Scoped Task

Complete portal follow-up attachments for verified customer tracking sessions.
Start by reading the existing portal attachment backend evidence and code; if the
backend upload/privacy path already satisfies the SRS, keep product changes to
the smallest missing UI/client/test proof needed for customers to add follow-up
attachments from the tracking flow.

## Scope

- Support customer follow-up attachments only after successful portal
  verification/session access, never from reference number alone.
- Allow follow-up information and attachments only when the complaint is not
  closed or rejected.
- Enforce the existing attachment allowlist and size limits through the backend:
  images/PDFs up to 10 MB, audio/video up to 50 MB, executable files blocked.
- Associate uploaded files with the complaint and portal uploader context, and
  preserve audit logging for portal upload actions.
- Keep portal responses public-safe: no internal comments, audit entries, staff
  PII, DMS codes, storage keys, public URLs, download tokens, provider fields, or
  unrelated complaint data.
- Use the existing same-origin portal client/proxy patterns. No direct browser
  storage/S3/provider calls and no credentials or secrets in frontend code.
- Provide localized English/Arabic UI with loading, empty, success, validation,
  denied, closed-complaint, and generic error states.
- Update OpenAPI and contract tests if any route, schema, or response shape
  changes.
- Update `.forge/evidence.md`, `.forge/state.md`, and `.forge/next.md` at task
  end.

## Likely Files

- `apps/api/src/modules/attachments/**`
- `apps/api/src/modules/portal/**`
- `apps/api/test/attachments*.test.ts`
- `apps/api/test/portal*.test.ts`
- `apps/web/src/app/portal/track/**`
- `apps/web/src/app/api/portal/**`
- `apps/web/src/components/portal*/**`
- `apps/web/src/lib/portal*.ts`
- `apps/web/src/i18n/**`
- `apps/web/test/**`
- `docs/openapi.yaml`
- `packages/contracts/openapi.json`
- `.forge/next.md`
- `.forge/state.md`
- `.forge/evidence.md`

## Skipped Work

- No staff attachment management rewrite.
- No portal attachment download route, public attachment link, download token, or
  storage key exposure unless a separate approved SRS-backed task authorizes it.
- No malware scanning provider integration, image recognition, file previewer, or
  binary storage in PostgreSQL.
- No DMS work, DMS writeback, live provider credentials, or provider SDK.
- No duplicate/related complaint UX hardening.
- No reports/business-fit changes.
- No final SRS/business-fit audit.

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

If schema or migration files change, also run:

- `corepack pnpm prisma:validate`
- `corepack pnpm --dir packages/database generate`
- `corepack pnpm db:migrate:test`

## Reviewer Rule

End this implementation slice with Forge updates and set the next task to a
portal attachment follow-up reviewer stop. Do not claim the slice reviewed in
the build commit. The reviewer must re-check portal privacy, upload limits,
audit behavior, OpenAPI, visual/accessibility proof, and denied/closed complaint
cases before this slice can be called reviewed.

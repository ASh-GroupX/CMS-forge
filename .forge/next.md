# UI/UX Refactor - Slice 7 Customer Portal

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: ui-ux-redesign
Risk: Medium
SRS IDs: `ARCH-UI-001`, `UI-SCREEN-001`, `UI-DESIGN-001`, `QA-UI-001`, `REQ-LOCALIZATION-001`, `REQ-PORTAL-001`, `REQ-PORTAL-002`, `REQ-SURVEY-001`, `PORTAL-SEC-001`
Skills: `ui-ux-pro-max`, `redesign`, `design-qa`, `design-taste-frontend` supporting anti-slop only

## Task

Continue the CMS-Auto UI/UX refactor after the admin, reports, audit, and
notifications slice. Migrate the public customer portal surfaces onto a
trust-first portal experience without changing portal verification, public route
contracts, privacy boundaries, attachment handling, or backend authority.

## Scope

- Refactor portal submit, tracking, follow-up, attachment, and survey surfaces.
- Use the portal shell and shared primitives where they fit, with larger public
  touch targets and fewer competing panels than staff screens.
- Strengthen privacy and verification messaging without exposing internal staff
  data, audit logs, DMS codes, staff PII, unrelated complaints, or internal
  comments.
- Keep portal verification backend-owned; tracking must not work from reference
  number alone.
- Preserve existing typed portal API helpers and route behavior.
- Use semantic tokens, dictionary copy, Arabic RTL, and English LTR.
- Do not introduce staff-workbench visual language into public portal screens.

## Proof

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm test:visual`
- `corepack pnpm web:visual-review`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm web:perf`
- `git diff --check`

## Stop When

- Portal submit, track, follow-up, attachment, and survey flows are visibly
  trust-first and mobile-friendly.
- Portal verification and privacy constraints remain backend-owned and covered
  by existing proof.
- Portal screens do not expose internal comments, audit logs, DMS codes, staff
  PII, unrelated complaints, or staff-only workflow details.
- No production route behavior, OpenAPI contract, portal privacy, attachment,
  verification, RBAC, branch scope, audit, or notification rule changes.
- No new UI dependency is introduced.

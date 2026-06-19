# Build Task: F6-01A - Bootstrap Next.js Staff Shell With Localized RTL/LTR Navigation

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 6 - Staff UI

## Scope

Start Phase 6 by replacing the web liveness-only surface with the smallest real
staff UI shell foundation.

Do:
- Bootstrap the `apps/web` runtime as a Next.js App Router app using the existing
  Tailwind token foundation.
- Add a localized staff shell first screen with Arabic RTL and English LTR
  direction support.
- Add dense operational navigation entries for dashboard, work queue, complaint
  create/detail, admin, reports, audit, and notifications as placeholders only.
- Keep all display text behind a tiny locale dictionary; no hardcoded
  user-facing strings in components.
- Add a real focused `test:web -- shell` check for shell rendering, route labels,
  and RTL/LTR direction.

Do not add:
- API calls or typed client behavior.
- Login/session behavior.
- Complaint queue data, workflow actions, forms, uploads, reports, or admin CRUD.
- Visual, accessibility, or performance runner implementation beyond the focused
  `test:web` shell check.

## Requirement IDs

- UI-SCREEN-001
- UI-DESIGN-001
- REQ-LOCALIZATION-001
- METHOD-TEST-001

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:web -- shell`
- `git diff --check`

## Acceptance

- Staff shell renders as the first web screen, not a marketing page or liveness
  JSON response.
- Shell supports both `en`/LTR and `ar`/RTL labels/direction through a shared
  locale dictionary.
- Navigation is operational and dense, but placeholder-only; no frontend
  business/workflow authority is introduced.
- `test:web -- shell` is a real passing check, not `pending-proof`.

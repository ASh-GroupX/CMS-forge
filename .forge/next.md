# P9-04F-1 Admin Branches/Departments Route Extraction

Status: Ready to Build
Required model tier: BUILDER-STANDARD
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Risk: Medium

## Context

PLAN-P9-FULL expanded the remaining Phase 9 backlog from P9-04F through P9-08.
P9-04F is the next unfinished workstream and is too large as a group, so this
first slice covers only the Admin branches/departments screen.

Follow the accepted P9-04 route + component pattern:

- real App Router route under `apps/web/src/app/(staff)/...`
- screen component under `apps/web/src/components/.../index.tsx`
- legacy `apps/web/src/app/*.tsx` wrapper retained for the old shell
- focused shell tests and existing visual/accessibility gates

## Scope

Implement only:

1. Add a real route at `apps/web/src/app/(staff)/admin/branches/page.tsx` that
   resolves locale and optional admin preview state, then renders the branches/
   departments admin component.
2. Move `AdminBranchesDepartments` into
   `apps/web/src/components/admin-branches-departments/index.tsx`.
3. Use existing shadcn/ui primitives and design tokens where the current component
   hand-rolls cards, tables, badges, and buttons. Do not add new primitives unless
   an existing shadcn component is missing.
4. Keep `apps/web/src/app/admin-branches-departments.tsx` as a compatibility
   wrapper/re-export until the old shell is retired.
5. Update `apps/web/test/shell/shell.test.ts` with focused route coverage and move
   source-safety assertions to the new component path.

## Acceptance

- The new `(staff)/admin/branches` route renders English and Arabic RTL labels.
- Branch and department tables keep loading, empty, error, success, validation,
  and conflict states already covered by the admin shell tests.
- The UI remains render-only: no `fetch`, browser storage, cookie access, role/
  actor/session authority, provider calls, audit mutation, hard delete, or
  backend-owned master-data decisions in React.
- No backend admin route, OpenAPI contract, user/role screen, category/SLA screen,
  notification-template screen, reports, or audit viewer changes in this task.

## SRS IDs

REQ-ADMIN-001, UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

## Required Proof Commands

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm test:visual`
- `corepack pnpm test:e2e -- accessibility`

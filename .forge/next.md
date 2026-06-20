# P9-04E-1 Complaint Detail Workspace Route Extraction

Status: Ready to Build
Required model tier: BUILDER-STANDARD
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Risk: Medium

## Context

PLAN-P9-04E split the complaint workspace group because P9-04E covers complaint
detail, workflow modal, comments/public updates, and attachment controls. This
first slice creates the real complaint detail route and moves the existing
workspace out of `app/` into `components/` using the accepted P9-04A/P9-04D
route + component extraction pattern.

## Scope

Implement only:

1. Add a real App Router route at
   `apps/web/src/app/(staff)/complaints/[id]/page.tsx` that resolves locale,
   optional preview states, and the route `id`, then reads detail through
   `getStaffComplaintDetail` with forwarded session cookies.
2. Move the existing complaint detail workspace UI into
   `apps/web/src/components/complaint-detail-workspace/index.tsx`. Use existing
   shadcn/ui primitives and design tokens where the component currently hand-rolls
   cards, buttons, and badges; keep all user-facing strings from i18n.
3. Keep legacy `apps/web/src/app/complaint-detail-workspace.tsx` as a
   compatibility wrapper/re-export until the old shell is retired.
4. Update `apps/web/test/shell/shell.test.ts` with focused route coverage and
   move existing source-path assertions to the new component path.

## Acceptance

- The new `(staff)/complaints/[id]` route renders English and Arabic RTL complaint
  detail UI.
- The route forwards the session cookie through `getStaffComplaintDetail` and
  does not pass role, actor, workflow, branch-scope, owner, token, credential, or
  client-selected authority fields.
- The workspace keeps complaint facts, customer data, vehicle data, owner/SLA,
  timeline, survey results, comments, attachments, workflow, loading, empty,
  error, validation, success, conflict, and confirmation states already covered
  by shell tests.
- The component remains render-only: no `fetch`, browser storage, cookie access,
  direct provider/storage URL, workflow transition logic, upload/download
  transport, or portal/private-data exposure.
- Do not add workflow mutation, comment write, attachment upload/download wiring,
  backend routes, or OpenAPI changes in this task.

## SRS IDs

UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

## Required Proof Commands

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm test:visual`
- `corepack pnpm test:e2e -- accessibility`

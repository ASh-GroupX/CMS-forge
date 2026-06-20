# P9-04D-1 Customer/Vehicle Lookup Route Extraction

Status: Ready to Build
Required model tier: BUILDER-STANDARD
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Risk: Medium

## Context

PLAN-P9-04D split the intake group because the original P9-04D bundled lookup,
complaint creation, and attachments into one oversized build task. This first
slice covers UI-007 only and follows the accepted P9-04A/P9-04C golden pattern.

There is no typed staff customer/vehicle lookup API or backend route in the repo
today. Do not invent a fake fetch/client/backend endpoint in this task. Keep the
lookup panel render-only and preserve the no-fetch/no-browser-storage boundary.

## Scope

Implement only:

1. Add a real App Router route at `apps/web/src/app/(staff)/complaints/new/page.tsx`
   that resolves locale and optional lookup preview state, then renders the lookup
   component.
2. Move the lookup UI into `apps/web/src/components/customer-vehicle-lookup/index.tsx`.
   Use shadcn/ui primitives and design tokens; keep all user-facing strings from
   existing i18n.
3. Keep legacy `apps/web/src/app/customer-vehicle-lookup.tsx` as a compatibility
   wrapper/re-export until the old shell is retired.
4. Update `apps/web/test/shell/shell.test.ts` with focused route/component source
   coverage and update existing source-path assertions to the new component path.

## Acceptance

- The new `(staff)/complaints/new` route renders English and Arabic RTL lookup UI.
- The panel keeps the required search fields: phone, customer code, customer name,
  VIN, and plate number.
- The panel keeps local/DMS source indicators, manual fallback, and loading/no-match/
  error states with correct `status`/`alert` roles.
- The component has no `fetch`, browser storage, cookie access, role/actor/session
  authority, hardcoded secrets, or backend-owned workflow/state decisions.
- Legacy staff shell rendering stays compatible through the wrapper.
- Do not edit complaint create or attachment upload panels in this task.

## SRS IDs

UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

## Required Proof Commands

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm test:visual`
- `corepack pnpm test:e2e -- accessibility`

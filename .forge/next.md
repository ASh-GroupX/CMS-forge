# UI/UX Refactor - Slice 9 Final Visual QA Gate

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: ui-ux-redesign
Risk: High
SRS IDs: `ARCH-UI-001`, `UI-SCREEN-001`, `UI-DESIGN-001`, `QA-UI-001`, `REQ-LOCALIZATION-001`, `PORTAL-SEC-001`
Skills: `ui-ux-pro-max`, `redesign`, `design-qa`, `design-taste-frontend` supporting anti-slop only

## Task

Complete the final UI/UX visual QA gate for the CMS-Auto refactor. Verify the
redesigned staff and portal surfaces across English LTR and Arabic RTL, confirm
keyboard/accessibility/performance proof, and make only narrowly scoped fixes
needed to satisfy the final gate.

## Scope

- Review English and Arabic screenshots for every redesigned screen covered by
  the proof harness.
- Check applicable viewport sizes: 390px, 430px, 768px, 1024px, 1280px, and
  1440px where the harness or manual browser checks expose them.
- Verify keyboard-only paths through navigation, filters, forms, workflow
  actions, portal verification, portal submit, and portal tracking.
- Confirm axe serious/critical violations remain at zero.
- Confirm no page-level horizontal overflow, clipped Arabic text, incoherent
  overlap, production `PreviewState`, fake modal semantics, empty `href`, or new
  hardcoded user-facing English outside dictionaries.
- Preserve backend authority, route behavior, OpenAPI contracts, RBAC, branch
  scope, audit, reports, notifications, attachments, portal privacy, Arabic RTL,
  and English LTR.

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

- Final visual QA evidence covers every redesigned proof surface in English and
  Arabic.
- Browser-backed visual, axe, keyboard, localization, and perf proof passes.
- No production `PreviewState`, fake modal semantics, or empty `href` remains.
- No new hardcoded user-facing English outside dictionaries is introduced.
- No page-level horizontal overflow, clipped Arabic text, or incoherent overlap
  is visible in reviewed artifacts.
- All UI/UX refactor slices are marked complete and Forge evidence is complete.
- No new UI dependency is introduced.

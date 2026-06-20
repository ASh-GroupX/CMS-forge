# Build Task: P9-01A - Staff Shell Arabic And Root Direction

Status: Ready to Build
Required model tier: BUILDER-STANDARD
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Risk: Medium
Requirements: REQ-LOCALIZATION-001 AC1, REQ-LOCALIZATION-001 AC2, UI-DESIGN-001 AC3, UI-DESIGN-001 AC4

## Goal

Fix the first visible locale bug without making a huge i18n diff:

- Rewrite corrupted Arabic strings in `apps/web/src/i18n/staff-shell.ts` as valid
  UTF-8 Arabic.
- Wire `apps/web/src/app/layout.tsx` so the root `<html>` uses `lang="ar" dir="rtl"`
  for Arabic locale and `lang="en" dir="ltr"` otherwise. If layout needs the current
  URL locale, add the smallest request-header bridge in `apps/web/src/middleware.ts`.
- Add a focused localization test. Prefer a new
  `apps/web/test/localization/staff-shell-localization.test.ts` suite and extend
  `tools/web-test.mjs` to allow `localization`.

## Scope

Expected files: 4-5.

Allowed:
- `apps/web/src/i18n/staff-shell.ts`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/middleware.ts` only if needed for root locale
- `apps/web/test/localization/staff-shell-localization.test.ts`
- `tools/web-test.mjs`

Do not edit the other i18n files in this task. P9-01B..P9-01E cover them.

## Acceptance

- Staff shell Arabic text contains real Arabic Unicode characters and no mojibake
  markers such as U+00C3, U+00C2, U+00D8, U+00D9, or U+FFFD.
- The English language switch target displays real Arabic text, not mojibake.
- Rendered staff shell keeps `dir="rtl"` for Arabic and `dir="ltr"` for English.
- Root document locale helper/layout covers Arabic RTL and English LTR.
- No business/workflow authority moves into React.

## Proof Commands

- `corepack pnpm test:web -- localization`
- `corepack pnpm test:e2e -- ui-smoke`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm lint`
- `corepack pnpm typecheck`

## On Success

- Append evidence for P9-01A only.
- Mark P9-01A done in `.forge/backlog.md`.
- Write P9-01B as the next task; do not start P9-02 until P9-01A..P9-01E are done.
- Replace `.forge/state.md` with a short `Ready to Build` snapshot.

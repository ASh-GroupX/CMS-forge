# Current State

Status: Radix dropdown and scrollbar convergence is complete and live on port 4000.
Phase: Shared interaction-surface correction verified; authentication recovery remains an operator action.
Next Task: Hard-refresh and review menus, then bootstrap the local admin credential.
Model Tier: GPT-5.5 Extra High or equivalent.

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in `.forge/archive/state-archive.md`.

## Snapshot

- Work is isolated on `codex/cms-auto-visual-redesign`.
- The pulled origin already contained the P12B permission guards and the later
  universal-assignment implementation; no backend redesign was required.
- Installed `.agents/skills/redesign-existing-projects` and used its audit
  sequence to converge typography, palette, interaction, layout, components,
  and state treatment without changing the application stack.
- Added IBM Plex Sans Variable and IBM Plex Sans Arabic, semantic carbon/cobalt
  light and dark tokens, a CMS-Auto handoff-lane mark, a 272px navigation rail,
  64px command bar, redesigned auth and portal shells, and presentation-only
  shared wrappers.
- Existing shadcn primitives were adapted rather than replaced by handwritten
  controls. All touched source files remain under the 300-line limit.
- EN/AR and light/dark screenshots were generated and inspected. The persisted
  `cms-theme` behavior, RTL direction, reduced motion, responsive tables, and
  mobile portal layouts remain intact.
- No endpoint, OpenAPI source, workflow rule, RBAC decision, persistence model,
  or server-owned authority changed.
- The unrelated dirty change in `docs/operations/runbook.md` remains preserved.

## Proof state

- Passed: shell 213/213, localization 13/13, UI smoke, accessibility 26 route
  previews, visual 116 route previews, visual review, performance 5 previews,
  typecheck, lint, production compilation/static generation, and diff check.
- Unsupported: `test:e2e -- localization`; this runner has no such mode. The
  dedicated `test:web -- localization` suite passed 13/13.
- Blocked: `openapi:check` reports that origin's document is not canonical.
- Environment note: the aggregate pnpm build command is intercepted by the
  Codex supply-chain approval gate. Every underlying build stage passed when
  invoked directly with the installed repository toolchain.

## Authentication diagnosis

- API health returned 200 with database and Redis configured.
- The local admin exists, is active, is unlocked, and uses the current seed hash.
- The documented bootstrap credential does not verify against that seed hash.
- Recent login audit events safely report `AUTH_INVALID_CREDENTIALS` without
  containing submitted passwords or hashes.
- No authentication code or database credential was changed without the
  operator selecting the replacement password.

## Live runtime

- The old three-week-old Docker web image was replaced.
- The rebuilt `cms-forge-web` container is serving port 4000.
- Live endpoint verification returned HTTP 200 and contained the new staff
  identity, handoff motif, navigation tokens, and cockpit entrance styling.
- The initial Docker rebuild stalled in BuildKit; its validated orphaned helper
  processes were stopped. A focused cached web-image build then passed, and the
  container was recreated successfully. API, PostgreSQL, Redis, MinIO, and
  worker containers remain running.
- Applied all seven pending checked-in migrations after creating a pre-migration
  dump inside the PostgreSQL container. Prisma now reports all 29 migrations
  applied and the database schema current.
- Removed only the two obsolete three-week-old API/worker containers that were
  duplicating service aliases and emitting stale P1001 errors. No images,
  volumes, or database data were removed.
- Current API and web endpoints both return HTTP 200 with no new P1001 or
  missing-column messages from the active services.
- Light mode now renders light auth/navigation surfaces; dark mode explicitly
  restores graphite nav tokens. The desktop rail cannot scroll horizontally and
  retains vertical scrolling for long navigation.
- Added dedicated light/dark auth and shell captures, inspected all four, and
  rebuilt the live web container with the corrected compiled CSS.
- Every feature dropdown now uses the shared Radix/shadcn form select; no legacy
  source-level native `<select>` remains outside the Radix implementation.
- Select popups retain the requested trigger-sized viewport classes and Lucide
  chevron, with semantic light/dark surfaces and logical RTL item alignment.
- Page and menu scrollbars now use semantic track/thumb colors, compact geometry,
  brand active feedback, horizontal treatment, and reduced-motion-safe smooth scrolling.
- Inspected complaint intake in EN light and reports in AR dark, passed all 118
  visual previews, rebuilt the live web image, and confirmed port 4000 returns 200.

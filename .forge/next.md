# Plan Task: P9-04 - Plan One Golden Screen And Screen Refactor Split

Status: Ready to Plan
Required model tier: PLANNER
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Risk: Medium
Requirements: UI-DESIGN-001 AC1, UI-DESIGN-001 AC2, UI-DESIGN-001 AC3, UI-DESIGN-001 AC4, UI-DESIGN-001 AC5, UI-DESIGN-001 AC6, UI-SCREEN-001

## Goal

Plan the golden-screen redesign workflow before refactoring screens. Build one
approved golden screen first, then split the remaining screen refactors into
small build tasks.

## Planning Inputs

- `.forge/backlog.md`
- `.forge/evidence.md` latest Phase 9 entries
- `.forge/trust.md` latest Phase 9 entries
- `docs/ARCHITECTURE.md` section 8
- `docs/CMS_AUTO_SRS.md` `UI-DESIGN-001` and `UI-SCREEN-001`
- current `apps/web/src/app` screens
- generated shadcn primitives under `apps/web/src/components/ui`
- `coverage/web-visual-review/index.html` from `corepack pnpm web:visual-review`

## Output

- Choose one golden screen candidate and write the first build task only.
- Split later screen refactors into backlog-sized tasks, each with visual review,
  RTL/LTR, accessibility, and real-data/no-placeholder acceptance.
- Keep each build task near 1-5 files plus focused tests where possible.
- Do not start broad screen refactors during planning.

## Acceptance

- `.forge/next.md` contains the first buildable P9-04 golden-screen task.
- `.forge/state.md` is `Ready to Build`.
- The plan explicitly preserves backend authority, real typed API clients, Arabic
  RTL / English LTR, required UI states, accessibility, and visual review gates.

## Proof Commands

- `corepack pnpm web:visual-review`
- planner review of the latest visual artifacts

## On Success

- Append planning evidence for P9-04.
- Replace `.forge/state.md` with a short `Ready to Build` snapshot.

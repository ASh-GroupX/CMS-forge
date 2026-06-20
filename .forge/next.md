# Plan Task: PLAN-P9-03 - Split Shadcn Adoption

Status: Ready to Plan
Required model tier: PLANNER
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Risk: Medium
Requirements: UI-DESIGN-001 AC1, UI-DESIGN-001 AC2, UI-DESIGN-001 AC3, UI-DESIGN-001 AC4, UI-DESIGN-001 AC5, UI-DESIGN-001 AC6

## Goal

Split P9-03 into small buildable tasks before coding. The backlog item is too
large for one builder pass because it includes shadcn initialization, base
primitive installation, token/theme adoption, accessibility/tailwind tooling,
and Playwright screenshot/vision-review workflow setup.

## Planning Inputs

- `.forge/backlog.md`
- `docs/ARCHITECTURE.md` section 8
- `docs/CMS_AUTO_SRS.md` `UI-DESIGN-001`
- current `apps/web` package/config/component layout
- existing web proof scripts under `tools/`

## Output

- Replace `.forge/next.md` with the first small P9-03 build task.
- Keep each build task near 1-5 files plus focused tests.
- Use shadcn/ui CLI for UI primitives; do not hand-roll base primitives.
- Include exact proof commands for each split task.
- Replace `.forge/state.md` with a short `Ready to Build` snapshot when the first
  split task is ready.

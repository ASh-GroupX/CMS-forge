# PLAN-P9-04D Split Intake Group

Status: Ready to Plan
Required model tier: PLANNER
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Risk: Medium

## Context

P9-04C is complete. P9-04D is currently a container task covering customer/vehicle
lookup, complaint create, and attachment upload panels. That is too large for one
BUILD task under the 1-5 file budget.

## Planning Scope

Split P9-04D into the next smallest buildable task using the golden pattern:

- real App Router route under `src/app/(staff)/...`
- component under `src/components/<feature>/index.tsx`
- legacy `src/app/<feature>.tsx` wrapper retained until the old shell is retired
- focused shell tests
- required proof commands

Prefer the first intake panel that can be completed in 1-5 files plus tests.

## Do Not Build Yet

This is a PLANNER task. Do not implement P9-04D until `.forge/next.md` contains a
single Ready to Build task.

## SRS IDs

UI-DESIGN-001, UI-SCREEN-001, REQ-LOCALIZATION-001

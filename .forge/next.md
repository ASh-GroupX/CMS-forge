# PLAN-P9-04E Complaint Workspace Group Split

Status: Needs planning
Required model tier: PLANNER
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Risk: Medium

## Context

P9-04D is complete. The next backlog item is P9-04E:

> Refactor complaint workspace group: complaint detail, workflow modal,
> comments/public updates, and attachment status/download controls.

That group is too large for a single 1-5 file build task. Split it into small
buildable tasks before any implementation.

## Planning Scope

Create the next build task for only the first safe P9-04E slice. Keep each slice
near 1-5 files plus tests and preserve the accepted P9-04A/P9-04D route +
component extraction pattern.

## Required Output

- Rewrite `.forge/next.md` with one buildable P9-04E task.
- Set `.forge/state.md` to `Ready to Build`.
- Include SRS IDs and exact proof commands.
- Do not implement code during planning.

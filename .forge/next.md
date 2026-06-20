# PLAN-P9-04F Split Admin Configuration Group

Status: Ready to Plan
Required model tier: PLANNER
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Risk: Medium

## Context

P9-04E is complete. The next backlog item is P9-04F:

`Refactor admin configuration group: users/roles, branches/departments,
categories/severity, SLA policies, and notification templates`

This is too large for one builder task and must be split before implementation.

## Scope

Plan only:

1. Split P9-04F into buildable tasks, each near 1 to 5 files plus focused tests.
2. Keep each slice inside Phase 9 and preserve the accepted P9-04 route +
   component extraction pattern.
3. Include exact verification commands and SRS IDs for each first build task.
4. Write the first P9-04F build task to `.forge/next.md` and set
   `.forge/state.md` to `Ready to Build`.

## Acceptance

- No code changes.
- P9-04F is split enough that the first builder task can stay small.
- The first task preserves backend-owned authority, admin RBAC, OpenAPI
  boundaries, i18n, visual, and accessibility proof requirements.

## Required Inputs

- `.forge/project.md`
- `.forge/policy.md`
- `.forge/state.md`
- `.forge/backlog.md`
- latest active-phase entries of `.forge/evidence.md` and `.forge/trust.md`
- `docs/ARCHITECTURE.md`
- `docs/CMS_AUTO_SRS.md` requirement IDs for the selected admin UI slice

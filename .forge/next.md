# Next Task: F0-01 - Repository Scaffold Plan

## Model Guidance

- Tier: PLANNER
- Why: The repo currently contains the SRS only; first step is to turn the
  contract into a small build plan before scaffolding code.
- Escalate to: BUILDER-STRONG when implementation starts.
- Do not use: BUILDER-SMALL.

## Requirement IDs

- CONTRACT-READINESS-001
- CONTRACT-READINESS-002
- ARCH-STACK-001
- ARCH-API-001
- ARCH-DATA-001
- UI-DESIGN-001

## Task

Read `docs/CMS_AUTO_SRS.md` and write the first implementation task for the
repository scaffold.

The next build task must define:

- package manager and scripts
- app/package layout
- UI stack and design-token/component foundation
- required scripts including `test:visual` and `web:perf`
- strict TypeScript, lint, format, coverage, OpenAPI drift, boundary lint, visual, accessibility, and frontend performance gates
- module generator/scaffold approach
- golden reference module candidate and why
- initial Docker services
- initial verification commands
- exact files allowed for the scaffold task

## Must Pass

- No code changes in this planning task.
- `.forge/next.md` is replaced with a buildable scaffold task.
- `.forge/state.md` is updated to `Ready to Build`.

## Exit Criteria

The next AI can implement the scaffold without rereading the whole SRS.

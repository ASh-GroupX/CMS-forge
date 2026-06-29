# Next-Phase Planning / Audit Stop

Status: Planner Stop
Required model tier: Planner/Reviewer
Phase: Next phase not selected
Risk: Medium
SRS IDs: TBD by planner

## Scoped Task

Plan the next phase from the current Forge state and active evidence. Do not
implement product code in this stop.

## Read First

1. `.forge/project.md`
2. `.forge/policy.md`
3. `.forge/state.md`
4. Latest Phase 17 entries in `.forge/evidence.md`
5. `docs/ARCHITECTURE.md`
6. Relevant `docs/CMS_AUTO_SRS.md` sections for the selected next phase

## Planning Focus

- Confirm Phase 17 is complete and no repair task remains.
- Select the smallest next scoped task, preferably one phase slice and about 1
  to 5 files plus focused tests.
- Carry forward known debt explicitly:
  - related complaint linking;
  - duplicate warning UI after backend duplicate/related-complaint behavior;
  - vehicle manual/DMS provenance flags;
  - portal attachment follow-up.
- Do not clean, stage, revert, or normalize unrelated dirty worktree changes.
- Do not start implementation until `.forge/next.md` is replaced with a concrete
  build or reviewer task.

## Proof Commands

- `git status --short`

## Outcome

Update `.forge/next.md` with the selected concrete next task and update
`.forge/state.md` with the planning result. Append evidence only if a real check
or decision was made.

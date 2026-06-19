# Forge Protocol

Use this file as the only AI entrypoint:

```text
Read .forge/forge.md and follow it.
```

For explicit phase autopilot:

```text
Read .forge/forge.md and follow AUTO PHASE for Phase N.
```

## 1. Read First

Read these files in order:

1. `.forge/project.md`
2. `.forge/policy.md`
3. `.forge/state.md`
4. `.forge/next.md`
5. `.forge/models.md`
6. `CLAUDE.md` / `AGENTS.md` — the short agent build rules.
7. `docs/ARCHITECTURE.md` — the architecture blueprint (the "how").

If the task references requirements, also read `docs/CMS_AUTO_SRS.md`.

`state.md` is a short current-state snapshot - read it whole, but it must stay
small. `evidence.md` and `trust.md` are append-only logs: read only the latest /
active-phase entries, never the whole file. Older history lives in `.forge/archive/`.

## 2. Decide Phase

- If `state.md` says `Ready to Plan`, run PLAN.
- If `state.md` says `Ready to Build`, run BUILD.
- If `state.md` says `Needs Verify`, run VERIFY.
- If `state.md` says `Needs Review`, run REVIEW.
- If `state.md` says `Needs Phase Review`, run PHASE REVIEW.
- If `state.md` says `Blocked` or `Needs Repair`, run BUILD on the repair task.
- If `next.md` says `Complete`, stop and report the final state.
- If the user explicitly asks to auto-run/autocomplete a phase, run AUTO PHASE
  instead of stopping after each successful task.

Before doing work, state the required model tier from `models.md`.

## PLAN

Use this when the next step is unclear or a phase needs task breakdown.

Inputs:
- `.forge/project.md`
- `.forge/backlog.md`
- `docs/CMS_AUTO_SRS.md`
- `docs/ARCHITECTURE.md`
- `CLAUDE.md` / `AGENTS.md`
- latest (active-phase) entries of `.forge/evidence.md` and `.forge/trust.md` -
  never load the whole log; older history is in `.forge/archive/`

Output:
- Write one buildable task to `.forge/next.md`.
- Update `.forge/state.md` to `Ready to Build`.
- Keep scope small: usually 1 to 5 files plus tests.
- Keep app/package/tool source files under the 300-line agentic budget unless the
  file is an explicit canonical exception.
- Include exact verification commands.
- Include requirement IDs from the SRS.

## BUILD

Use this when `.forge/next.md` contains an implementation task.

Rules:
- Implement only the declared scope.
- If the declared task is too large to stay near 1 to 5 files plus tests, stop:
  rewrite `.forge/next.md` as a planning/splitting task and set
  `.forge/state.md` to `Ready to Plan`.
- Do not weaken tests or acceptance criteria.
- Run every verification command that is available.
- Use honest labels: `Passed`, `Failed`, `Not Run`, `Assumed`.

If checks pass:
- Append evidence to `.forge/evidence.md`. For a High or Critical risk task, the
  evidence must include the security self-check from `policy.md`.
- Update `.forge/trust.md` with risk and recommendation.
- Mark the task done in `.forge/backlog.md`.
- If all tasks in the current backlog phase are done, stop phase advancement:
  write a phase review task to `.forge/next.md` and set `.forge/state.md` to
  `Needs Phase Review`.
- Otherwise write the next task or set `next.md` to `Needs planning`.
- Replace `.forge/state.md` with a short current-state snapshot - overwrite it, do
  not append task narrative (per-task detail goes in `evidence.md`). When
  `evidence.md`/`trust.md` outgrow a phase, rotate older phases into `.forge/archive/`.

If checks fail:
- Append failed evidence.
- Set `.forge/state.md` to `Blocked`.
- Rewrite `.forge/next.md` as the smallest repair task.
- Escalate model tier.

## AUTO PHASE

Use only when the user explicitly asks to finish a named phase without stopping
between successful tasks.

Rules:
- Stay inside the named phase only.
- Use the required tier for each task; for Phase 1 security work this is usually
  `BUILDER-STRONG`.
- Run the full BUILD loop for the current task, including proof commands,
  evidence, trust notes, backlog updates, and next-task updates.
- Every High or Critical risk task records the `policy.md` security self-check in
  evidence before it may count as successful.
- After a successful task, continue automatically if `.forge/state.md` is
  `Ready to Build` and `.forge/next.md` is still in the same phase.

Stop immediately when:
- `.forge/state.md` becomes `Ready to Plan` (needs PLANNER).
- `.forge/state.md` becomes `Blocked`, `Needs Review`, or `Needs Phase Review`.
- The next task leaves the named phase.
- Verification fails or the task would exceed the agentic scope budget.

Never skip proof commands, evidence, backlog updates, or the phase-end
`PHASE-REVIEWER` gate.

## VERIFY

Use a different model or fresh context from the builder.

Check:
- Did the change match the task?
- Were verification labels honest?
- Did tests actually run?
- Are there obvious regressions, security issues, or scope leaks?

Output:
- Builder honesty: Honest, Inflated, or Fabricated
- Code quality: Good, Acceptable, or Poor
- Recommendation: Accept, Repair, or Redo

Update `.forge/state.md` and `.forge/trust.md`. Then close the loop:
- On `Accept`: write the next in-phase task to `.forge/next.md` and set
  `.forge/state.md` to `Ready to Build` (AUTO PHASE resumes from here).
- On `Repair` or `Redo`: set `.forge/state.md` to `Needs Repair`, write the
  smallest repair task to `.forge/next.md`, and escalate tier. Autopilot stays
  stopped until the repair is built and re-verified.

## PHASE REVIEW

Use this when a backlog phase is complete before any task from the next phase
starts.

Required tier: `PHASE-REVIEWER`.

Use one of:
- Opus 4.8 Max
- GPT-5.5 Extra High

Inputs:
- `.forge/backlog.md`
- `.forge/evidence.md`
- `.forge/trust.md`
- `.forge/state.md`
- `.forge/next.md`
- `CLAUDE.md` / `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/CMS_AUTO_SRS.md` requirement IDs covered by the phase
- source files changed during the phase

Check:
- Every task in the phase is checked done in `.forge/backlog.md`.
- Evidence exists for every completed task and uses honest verification labels.
- Required proof commands actually ran, or gaps are explicit and acceptable.
- No failed, Not Run, or assumed checks hide a blocking acceptance risk.
- SRS acceptance criteria, architecture rules, security, audit, RBAC, OpenAPI,
  UI/UX, and test gates were not weakened.
- The next phase is safe to start.

Output one decision:
- `Accept Phase`: append the review to `.forge/trust.md`, write the first task
  from the next unfinished phase to `.forge/next.md`, and set state to
  `Ready to Build`.
- `Accept With Conditions`: same as accept, but record explicit non-blocking
  conditions in `.forge/trust.md`.
- `Repair Required`: write the smallest repair task to `.forge/next.md`, set
  state to `Needs Repair`, and do not start the next phase.
- `Redo Phase`: set state to `Ready to Plan` and write the replan scope to
  `.forge/next.md`.

## REVIEW

Use for high-risk or final acceptance decisions.

Review evidence, risk, assumptions, and unresolved gaps. Accept only when the
remaining risk is explicit and acceptable.

## Protected Files

Do not edit these unless the user explicitly asks to change the protocol:

- `.forge/forge.md`
- `.forge/policy.md`
- `.forge/models.md`

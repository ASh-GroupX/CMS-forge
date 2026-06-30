# Next Phase Planning / Audit Stop

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: Planning
Risk: High
SRS IDs: TBD by planner

## Scoped Task

Plan the next build phase. Do not implement product code during this stop.

Read the Forge state, latest evidence, architecture rules, and only the SRS IDs
needed for candidate ranking. Preserve review truth:

- Phase 18 is built but not fully reviewed because P18B reviewer was skipped.
- P19B is built but reviewer was skipped.
- P19C is built but reviewer was skipped.
- P20A is reviewed complete.
- Do not claim Phase 18 or Phase 19 fully reviewed.

## Candidate Areas To Rank

- Portal attachment follow-up completion.
- Customer lookup UI wiring to the DMS lookup adapter.
- Live DMS provider integration planning/build, still read-only.
- Phase 18/P19B/P19C reviewer catch-up.
- Any remaining high-value SRS business-fit gap found in Forge/SRS.

## Planning Output

- Pick the largest coherent next slice that does not depend on skipped reviews
  being reviewed.
- Name the phase clearly.
- Cite SRS IDs.
- Define scope, skipped work, proof commands, risk, and required model tier.
- Update `.forge/next.md` with the chosen build task.
- Update `.forge/state.md` with the planning snapshot.
- Append `.forge/evidence.md` with ranking, assumptions, skipped work, and
  verification.

## Proof To Run

- `git status --short`
- `git diff --check`

Do not run product tests unless product code changed.

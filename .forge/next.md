# Phase Review Task: PHASE-4-REVIEW - Customer Portal Acceptance Review

Status: Needs Phase Review
Required model tier: PHASE-REVIEWER
Risk: High
Phase: Phase 4 - Customer Portal

## Scope

Run the mandatory phase-end review for Phase 4 before any Phase 5 task starts.
Use a fresh reviewer context/model per `.forge/forge.md`.

Review the completed Phase 4 portal work:
- F4-01 public complaint submission
- F4-02 reference plus OTP verification and portal session tracking
- F4-03 portal-safe public timeline and follow-up path
- F4-04 explicit privacy regression tests

## Inputs

- `.forge/backlog.md`
- `.forge/evidence.md`
- `.forge/trust.md`
- `.forge/state.md`
- `.forge/next.md`
- `CLAUDE.md` / `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/CMS_AUTO_SRS.md`
- Phase 4 changed source and test files

## Review Checks

- Every Phase 4 task is checked done or any unchecked parent item is explained by
  completed child scope.
- Evidence exists for every completed Phase 4 task and uses honest verification
  labels.
- Required proof commands actually ran, with no hidden failed, assumed, or
  unrun checks.
- Customer portal routes do not expose internal comments, audit logs, DMS codes,
  staff PII, unrelated complaints, OTP values, OTP hashes, session tokens, or
  session hashes.
- Reference-only tracking is impossible; tracking and follow-up require verified
  portal sessions.
- Portal state-changing behavior keeps audit/security boundaries intact.
- OpenAPI, architecture, SRS, lint, typecheck, and test gates were not weakened.

## Output

Append the PHASE-4-REVIEW decision to `.forge/trust.md`.

On `Accept Phase` or `Accept With Conditions`, write the first Phase 5 task to
`.forge/next.md` and set `.forge/state.md` to `Ready to Build`.

On `Repair Required`, write the smallest repair task to `.forge/next.md`, set
`.forge/state.md` to `Needs Repair`, and do not start Phase 5.

On `Redo Phase`, set `.forge/state.md` to `Ready to Plan` and write the replan
scope to `.forge/next.md`.

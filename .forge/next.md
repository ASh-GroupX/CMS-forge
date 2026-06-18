# Next Task: PHASE-1-REVIEW - Security Baseline Acceptance Gate

Status: Needs Phase Review
Required model tier: PHASE-REVIEWER
Risk: High
Phase: Phase 1 - Security Baseline

## Why This Exists

All Phase 1 backlog tasks are now marked complete. Forge policy requires a fresh
`PHASE-REVIEWER` pass before Phase 2 starts.

## Inputs

- `.forge/backlog.md`
- `.forge/evidence.md`
- `.forge/trust.md`
- `.forge/state.md`
- `.forge/next.md`
- `AGENTS.md` / `CLAUDE.md`
- `docs/ARCHITECTURE.md`
- `docs/CMS_AUTO_SRS.md`
- Source files changed during Phase 1

## Review Scope

Check Phase 1 security baseline completion:

- Auth credential verification, sessions, logout, and audit.
- RBAC and branch-scope enforcement from server session.
- Audit search/export and append-only enforcement.
- Stable API error envelope and OpenAPI drift checks.
- Branches golden CRUD reference, including Admin-only writes and same-transaction
  `CONFIG` audit entries.
- Login rate limiting by account + IP.
- CSRF on session-authenticated mutation routes: auth logout and branch admin writes.

## Required Checks

- Every Phase 1 task is checked done in `.forge/backlog.md`.
- Evidence exists for every completed task and uses honest verification labels.
- Required proof commands actually ran, or gaps are explicit and acceptable.
- No failed, Not Run, or Assumed check hides a blocking acceptance risk.
- SRS acceptance criteria, architecture rules, security, audit, RBAC, OpenAPI, and
  test gates were not weakened.
- The next phase is safe to start.

## Output

Append the phase review decision to `.forge/trust.md`:

- `Accept Phase`
- `Accept With Conditions`
- `Repair Required`
- `Redo Phase`

On accept, write the first Phase 2 task to `.forge/next.md` and set `.forge/state.md`
to `Ready to Build`. On repair/redo, write the smallest repair/replan task and keep
Phase 2 blocked.

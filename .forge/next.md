# Plan Task: PLAN-F4-01 - Split Customer Portal Entry Work

Status: Ready to Plan
Required model tier: PLANNER
Risk: High
Phase: Phase 4 - Customer Portal

## Why This Exists

Phase 4 has not been planned yet. Customer portal submission, tracking,
verification, and privacy are high-risk public boundaries and must be split before
any build task starts.

## Inputs

- `.forge/project.md`
- `.forge/policy.md`
- `.forge/state.md`
- `.forge/backlog.md`
- `.forge/evidence.md`
- `.forge/trust.md`
- `CLAUDE.md` / `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/CMS_AUTO_SRS.md` requirement IDs:
  - REQ-PORTAL-001
  - REQ-PORTAL-002
  - PORTAL-SEC-001
  - REQ-NOTIFY-001
  - REQ-SURVEY-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001

## Planning Requirements

- Split Phase 4 into buildable tasks inside the 1 to 5 file scope budget.
- Start with the smallest safe customer-portal foundation task.
- Mark the first public portal privacy/security boundary with
  `Verify Gate: required`.
- Keep public submission, OTP verification, portal-safe timeline, and privacy tests
  as separate slices unless the SRS requires a tighter dependency.
- Include exact verification commands for each planned build task.
- Do not implement code during planning.

## Expected Output

- Write one buildable Phase 4 task to `.forge/next.md`.
- Update `.forge/state.md` to `Ready to Build`.
- Record the planning decision in `.forge/trust.md`.

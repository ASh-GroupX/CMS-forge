# Planner Task: PLAN-F3-01 - Split SLA And Workflow Operations

Status: Ready to Plan
Required model tier: PLANNER
Risk: High
Phase: Phase 3 - SLA And Workflow Operations

## Why This Exists

Phase 2 Complaint Core is accepted with non-blocking carry-forward conditions.
Phase 3 spans SLA policy math, SLA jobs, escalation notification events, and
additional workflow operations. Split it into the smallest buildable first task
before coding.

## Planning Scope

Plan only Phase 3:

- `F3-01`: SLA policy model and deterministic deadline calculation
- `F3-02`: SLA warning and breach jobs
- `F3-03`: Escalation notification events
- `F3-04`: Reopen, send-back, resolve, and close workflows

Do not implement code during this planner task.

## Required Inputs

- `.forge/project.md`
- `.forge/policy.md`
- `.forge/state.md`
- `.forge/backlog.md`
- `.forge/evidence.md`
- `.forge/trust.md`
- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/CMS_AUTO_SRS.md`

## Requirement IDs To Reconcile

- `REQ-SLA-001`
- `REQ-WORKFLOW-001`
- `REQ-WORKFLOW-002`
- `REQ-RESOLUTION-001`
- `REQ-NOTIFY-001`
- `SLA-CALENDAR-001`
- `ARCH-WORKFLOW-001`
- `METHOD-AUDIT-001`
- `METHOD-TEST-001`
- `API-STANDARD-001`

## Carry-Forward From Phase 2 Review

- First-response reporting: Phase 2 captures public staff comment timestamps.
  Before reports depend on this KPI, decide whether to compute first response from
  the first public staff comment or materialize it into `Complaint.firstResponseAt`.
- No real notification/SLA side effects exist yet; Phase 3 must enqueue side
  effects only after state commits.

## Output

- Write one buildable Phase 3 task to `.forge/next.md`.
- Set `.forge/state.md` to `Ready to Build`.
- Keep the task near 1 to 5 files plus focused tests.
- Include exact verification commands and SRS requirement IDs.
- Mark any Phase 3 security/workflow/SLA foundation that later Phase 3 tasks build
  on as `Verify Gate: required`.

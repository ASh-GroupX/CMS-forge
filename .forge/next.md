# Business Readiness Remediation - Slice 2

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: business-readiness-remediation
Risk: High
SRS IDs: ARCH-WORKFLOW-001, REQ-SLA-001, REQ-NOTIFY-001, METHOD-AUDIT-001

## Task

Implement Slice 2 from `docs/BUSINESS_READINESS_PLAN.md`: submitted staff and portal complaints create SLA deadline events after commit and enqueue acknowledgement/submit notifications, while draft complaints stay out of active SLA.

## Scope

- Inspect current complaints, workflow side-effect, SLA, notification, and existing workflow/portal tests before editing.
- Reuse existing backend services and side-effect helpers.
- Keep status history and audit in the creation transaction; enqueue side effects only after commit.
- Do not add frontend workflow authority.

## Proof

- `corepack pnpm test:api -- workflow`
- `corepack pnpm test:api -- portal`
- SLA warning/breach seeded proof if a registered suite exists; otherwise state the closest registered suite honestly.

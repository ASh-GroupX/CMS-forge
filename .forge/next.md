# Universal Assignments — Complete on `nour`

Status: Complete on isolated branch `nour` (not merged)
Required model tier: GPT-5.5 Extra High or equivalent
Branch: `nour`
Risk: High (RBAC, scope, audit, workflow, migration)
SSOT: `docs/UNIVERSAL_ASSIGNMENTS_PLAN.md`
SRS IDs: `REQ-RBAC-001`, `REQ-COLLAB-001`, `REQ-WORKFLOW-002`,
`REQ-AUDIT-001`, `REQ-SEARCH-001`, `REQ-REPORT-001`,
`REQ-LOCALIZATION-001`, `METHOD-MODULAR-001`, `METHOD-AUDIT-001`,
`METHOD-API-001`, `METHOD-TEST-001`

## Task

Universal assignment and forwarding is implemented for Tasks/Promises,
Complaints, Deals/Leads, and Cases/Requests. It supports a user, a department,
or both, with a reusable module/control and an extensible entity-type boundary.

## Constraints

- Do not merge or push until human review.
- Apply `20260718120000_universal_assignments` before deploying application code.
- Keep legacy fields and dual-write compatibility in place.
- Future modules adopt `AssignmentsService`; owning modules retain authorization.

## Proof

All required proof passed. Exact commands and counts are recorded in
`.forge/evidence.md` under “Universal assignment and forwarding”.

## Next human gate

Review the published `nour` branch, then decide whether to open a pull request.
No protected branch has been modified.

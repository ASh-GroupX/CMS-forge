# User Department Membership and Task Distribution

Status: Locally verified; production release in progress
Required model tier: GPT-5.5 Extra High or equivalent
Risk: High (user administration, task authorization, notifications, production migration)
SRS IDs: `REQ-ADMIN-001`, `REQ-RBAC-001`, `METHOD-AUDIT-001`,
`METHOD-API-001`, `METHOD-TEST-001`, `ARCH-UI-001`, `UI-DESIGN-001`

## Task

Require an active eligible department when administrators create or edit staff
users. Allow task creation to target multiple specific users and departments,
while preserving the SRS invariant that one selected user is the accountable
assignee. Resolve task visibility and notifications from the deduplicated union
of explicit participants and active members of selected departments.

## Required Gates

- Creating and changing a user's department is validated, persisted, and audited.
- Task department targets are relational database records and existing single
  department assignments are migrated without data loss.
- Active department members can see assigned tasks; inactive members cannot.
- Explicit users and department-derived users receive at most one notification.
- English LTR and Arabic RTL task assignment controls use live database options.
- Focused tests, migration checks, lint, typecheck, OpenAPI, and production
  deployment verification pass.

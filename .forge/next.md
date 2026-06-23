# P12A COMPLETE - DYNAMIC ROLE PERMISSION DATA MODEL

Status: P12A complete; ready to plan P12B server-side permission guard conversion
Required model tier: GPT-5 High or Opus 4.8 Max
Phase: Phase 12 - Dynamic RBAC
Risk: High
SRS IDs: REQ-RBAC-001, RBAC-MATRIX-001, REQ-ADMIN-001, METHOD-AUDIT-001

## Context

P12A adds the persistent data model for Admin-managed, selectable permissions
without changing any live authorization decision.

Completed scope: `Role.code` is now extensible, `permissions` and
`role_permissions` are modeled and migrated, and dev seed supplies the existing
role matrix as selectable permission templates. Existing guards remain role-code
based until P12B, so access has not changed.

## Next Scoped Task

P12B: add server-session permission loading and a permission guard alongside
the existing role guard. Do not convert route or workflow rules in the same
slice; require API allowed/denied proof and audit logging for denied checks.

## Guardrails

- Backend owns authority; roles and branch scope come from the server session.
- Do not accept role/branch authority from client input.
- Do not weaken password policy.
- Do not change customer portal privacy.
- Do not redesign release-reviewed P11 screens unless the next scoped task
  explicitly asks for it.
- No admin screens, AI, WhatsApp, mobile, deploy, or workflow builder unless the
  next scoped task explicitly asks for it.

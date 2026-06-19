# Current State

Status: Ready to Plan
Phase: Phase 7 - Reports, UAT, And Ops
Next Task: PLAN-F7-03A - Split Real Session-Bound Staff UI Data Wiring
Model Tier: PLANNER

## How to use this file

This is a SNAPSHOT of the current state only. REPLACE it each run - never append
task narrative. Per-task detail goes in `.forge/evidence.md`. Prior state history
is archived in `.forge/archive/state-archive.md`.

## Snapshot

- Phases 0-6 accepted; Phase 7 (Reports, UAT, Ops) in progress.
- Last built: F7-02B - guarded `GET /complaints/search` (RBAC + branch scope +
  bounded pagination + OpenAPI). F7-02 complete; proof passed (test 31/31,
  test:api -- search 4/4).
- Active: PLAN-F7-03A - split real staff login + session-bound web data wiring.
  Authority must come from the server session, not `?role=`. No browser tokens.

## Open carry-forward conditions / known debt

Recorded from phase reviews so log rotation does not bury them. Confirm current
status against `.forge/archive/trust-archive.md`; close items as resolved.

- `security:check` is a fail-loud placeholder; wire it to the real security suites
  before pilot sign-off.
- NFR-SEC-001 AC4: production HTTP->HTTPS redirect at the gateway, owed by the
  Phase 7 deployment runbook (F7-04).
- `POSTGRES_HOST_AUTH_METHOD: trust` is dev-only; parameterize before non-dev deploy.
- Username login is email-only until the users/admin model adds a username column
  (REQ-AUTH-001 AC1).
- Attachments: storage is in-memory and nothing transitions scan PENDING->CLEAN at
  runtime; a real S3 adapter and a scan driver are still owed before attachments
  work end to end.
- Consider a @Global core module for PrismaService/AuditService to cut per-module
  duplication.
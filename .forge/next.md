# Phase Review Task: PHASE-6-REVIEW

Status: Needs Phase Review
Required model tier: PHASE-REVIEWER
Risk: High
Phase: Phase 6 - Staff UI

## Goal

Perform the mandatory independent Phase 6 review before Phase 7 starts.

## Review Scope

- Re-read `.forge/project.md`, `.forge/policy.md`, `.forge/state.md`,
  `.forge/evidence.md`, `.forge/trust.md`, `docs/ARCHITECTURE.md`, and relevant
  UI/report/security requirement IDs from `docs/CMS_AUTO_SRS.md`.
- Verify Phase 6 staff UI scope against `UI-SCREEN-001`, `UI-DESIGN-001`,
  `QA-UI-001`, `REQ-AUTH-001`, `REQ-COMPLAINT-001`, `REQ-WORKFLOW-001`,
  `REQ-FILES-001`, `REQ-ADMIN-001`, `REQ-AUDIT-001`, `REQ-NOTIFY-001`,
  `REQ-REPORT-001`, `REQ-RBAC-001`, `NFR-PERF-001`, and `METHOD-TEST-001`.
- Independently inspect the changed frontend source, proof runners, and Forge
  logs for scope leaks, hidden authority decisions, privacy regressions,
  unverified claims, or incomplete Phase 6 surfaces.
- Re-run the required proof commands instead of trusting the builder log.
- Decide Accept Phase, Accept With Conditions, or Repair Required.

## Required Proof Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- api-client`
- `corepack pnpm test:visual`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm web:perf`
- `corepack pnpm openapi:check`
- `git diff --check`

## Acceptance Criteria

- Phase 6 cannot be accepted unless the reviewer confirms proof commands pass,
  frontend trust boundaries hold, UI proof is honest, and Phase 6 backlog scope is
  complete.
- If accepted, update `.forge/state.md`, `.forge/trust.md`, `.forge/evidence.md`,
  and `.forge/next.md` to begin Phase 7 planning or the next mandated gate.
- If repair is required, write the smallest repair task and keep Phase 7 blocked.

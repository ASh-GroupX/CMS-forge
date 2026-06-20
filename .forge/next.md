# Build Task: P10-09A Participant ACL and confidentiality service enforcement

Status: Ready to Build
Required model tier: BUILDER-STRONG
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Risk: Critical (confidential employee case privacy)

## SRS IDs

- REQ-RBAC-001
- NFR-SEC-002
- METHOD-MODULAR-001
- METHOD-API-001
- METHOD-TEST-001

## Scope

Build the first confidential employee-case backend slice.

Implement:
- Participant ACL and confidentiality enforced at the service/query layer.
- Accused users are denied by default.
- Conflict-of-interest guard.
- Denial audit behavior.
- Focused tests for one allowed and one denied confidential case path.

Rules:
- Backend owns confidentiality and ACL decisions; no frontend-only hiding.
- No portal exposure.
- No frontend, stack proof, or broad route work unless required to prove the
  service/query boundary.
- Keep within 1-5 files plus focused tests; otherwise stop and replan.

## Acceptance Criteria

- Confidential case reads are allowed only for authorized participants/roles.
- Accused/conflicted users are denied by default and produce a SECURITY audit
  entry.
- Tests cover one allowed path and one denied path.
- Evidence records the Critical-risk security self-check from `.forge/policy.md`.

## Verification

Run and label honestly:
- focused confidential case ACL test command created/used by the implementation
- `corepack pnpm typecheck`
- `corepack pnpm openapi:check`
- `corepack pnpm lint`
- `corepack pnpm test`
- `git diff --check`

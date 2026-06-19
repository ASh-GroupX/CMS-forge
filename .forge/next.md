# Build Task: F7-02A - Branch-Scoped Complaint Search Service

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High (search must respect RBAC and branch scope)
Phase: Phase 7 - Reports, UAT, And Ops

## Goal

Add the backend complaint search service/read model for REQ-SEARCH-001 with
branch-scoped filtering. HTTP route and OpenAPI are F7-02B.

## Read First

- `docs/CMS_AUTO_SRS.md` requirement `REQ-SEARCH-001`
- Existing complaint queue/detail patterns in `apps/api/src/modules/complaints`

## Scope

- `apps/api/src/modules/complaints/complaints.service.ts`
- `apps/api/src/modules/complaints/complaints.repository.ts`
- `apps/api/test/workflow/complaint-create.test.ts` or a small search API suite
- `tools/api-test.mjs` only if a new `search` suite is added

## Required Filters

- reference number
- customer identifier/name/phone where safely available
- status
- severity
- owner
- date range

## Rules

- No HTTP route yet; F7-02B owns controller/OpenAPI.
- Branch scope is a service/repository input representing server-session scope.
- Non-admin scoped users must not see out-of-branch complaints.
- Prefer extending existing branch-scoped queue filtering rather than duplicating
  a parallel query path.
- No frontend change, schema/migration, provider call, or direct privacy leak.

## Required Proof Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- workflow`
- `corepack pnpm openapi:check`
- `git diff --check`

## Acceptance Criteria

- Complaint search service/read model supports the required filters.
- Tests cover one allowed scoped result and one hidden out-of-branch result.
- No route, OpenAPI path, frontend change, schema/migration, provider call, or
  portal privacy leak is added.
- All required proof commands run and pass; evidence records honest labels and
  the High-risk security self-check.

## Requirement IDs

- REQ-SEARCH-001
- REQ-RBAC-001
- METHOD-MODULAR-001

## On Completion

- Append evidence to `.forge/evidence.md` and a trust note to `.forge/trust.md`.
- Mark F7-02A done in `.forge/backlog.md`.
- Write F7-02B (search HTTP route with pagination, RBAC, branch scope, and
  OpenAPI) to `.forge/next.md` at `BUILDER-STRONG`.

# Verify Task: VERIFY-F4-01C - Public Portal Submission Boundary

Status: Needs Verify
Required model tier: independent VERIFY
Risk: High
Phase: Phase 4 - Customer Portal

## Why This Exists

`F4-01C` is the first public customer portal boundary. Before OTP, sessions,
tracking, or portal-safe timeline work builds on it, independently verify that the
public submission route is scoped, rate-limited, audited safely, and does not
expose portal-private data.

## Inputs

- `.forge/next.md`
- `.forge/evidence.md`
- `.forge/trust.md`
- `.forge/backlog.md`
- `AGENTS.md` / `CLAUDE.md`
- `docs/ARCHITECTURE.md`
- `docs/CMS_AUTO_SRS.md` requirement IDs:
  - REQ-PORTAL-001
  - PORTAL-SEC-001
  - ARCH-WORKFLOW-001
  - METHOD-AUDIT-001
  - METHOD-TEST-001
  - API-STANDARD-001
- Source files changed for `F4-01A` through `F4-01C`.

## Verify Checks

- Did `POST /portal/complaints` match the scoped task?
- Does the route delegate to `PortalService.submitComplaint` and avoid complaint
  repositories, complaint DTO folders, and Prisma model imports?
- Does invalid portal input reject before service writes?
- Does rate limiting cover the public route and record safe `SECURITY` audit data?
- Does portal complaint creation still write complaint, initial status history, and
  COMPLAINT audit in one transaction through the complaints service?
- Does OpenAPI document the new route without exposing tracking/details?
- Are verification labels honest and did the proof commands actually run?
- Did the change avoid OTP/session/tracking/timeline/UI/schema/provider scope leaks?

## Required Proof Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- portal`
- `corepack pnpm test:api -- workflow`
- `corepack pnpm openapi:check`

## Output

- Builder honesty: Honest, Inflated, or Fabricated.
- Code quality: Good, Acceptable, or Poor.
- Recommendation: Accept, Repair, or Redo.
- On `Accept`, write `F4-02A - Add portal OTP request persistence and notification
  queueing` to `.forge/next.md` and set `.forge/state.md` to `Ready to Build`.
- On `Repair` or `Redo`, write the smallest repair task and set `.forge/state.md`
  to `Needs Repair`.

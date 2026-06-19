# Verify Task: VERIFY-F4-01C-REPAIR - Public Portal DMS Number Removal

Status: Needs Verify
Required model tier: independent VERIFY
Risk: High
Phase: Phase 4 - Customer Portal
Returns to Verify Gate: F4-01C

## Why This Exists

`REPAIR-F4-01C` removed DMS customer number from the public portal submission boundary after independent verify found that `customerNumber` mapped to `Customer.dmsCode`, which `PORTAL-SEC-001` forbids exposing through the customer portal.

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
- Source files changed by `REPAIR-F4-01C`.

## Verify Checks

- Does the public portal request DTO/parser exclude `customerNumber`?
- Does `PortalService.submitComplaint` force `customerNumber: null` before delegating to complaint creation?
- Does OpenAPI `PortalComplaintRequest` omit `customerNumber` while staff `ComplaintCreateRequest` remains unchanged?
- Do tests prove spoofed public `customerNumber` is stripped and not forwarded?
- Did required proof commands actually run, with sandbox `spawn EPERM` reruns honestly recorded?
- Did the repair avoid OTP/session/tracking/timeline/UI/schema/provider scope leaks?

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
- On `Accept`, write `F4-02A - Add portal OTP request persistence and notification queueing` to `.forge/next.md` and set `.forge/state.md` to `Ready to Build`.
- On `Repair` or `Redo`, write the smallest repair task and set `.forge/state.md` to `Needs Repair`.
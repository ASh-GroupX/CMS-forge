# Build Task: F4-01A - Generate Portal Module Boundary And Manifest

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 4 - Customer Portal
Verify Gate: required

## Why This Exists

Phase 4 starts the customer portal. Build the module boundary first so public
submission, tracking, OTP verification, and portal privacy behavior have a clear
backend owner before routes or UI are added.

## Scope

- Generate the `portal` module from the canonical module generator.
- Fill `apps/api/src/modules/portal/MODULE.md` with the real module boundary:
  public `PortalService`, owned portal verification/session tables, allowed deps,
  and SRS IDs.
- Keep this task behavior-free: no public routes, OpenAPI paths, complaint writes,
  OTP/session behavior, rate limiting, CAPTCHA, notifications, attachments, UI, or
  customer tracking response shapes.

## Requirement IDs

- REQ-PORTAL-001
- PORTAL-SEC-001
- ARCH-WORKFLOW-001
- METHOD-AUDIT-001
- METHOD-TEST-001
- API-STANDARD-001

## Implementation Rules

- Use `corepack pnpm generate:module -- portal`; do not hand-roll structure.
- The portal module may depend on `core/http-kernel` and other modules' public
  services only. It must not import another module's repository, DTO folder, or
  Prisma model type.
- Customer portal privacy is the trust boundary: no internal comments, audit logs,
  DMS codes, staff PII, or unrelated complaints may be exposed by any future portal
  API.
- If adding real submission behavior is needed to make this task pass, stop and
  replan instead of widening the diff.

## Verification Commands

- `corepack pnpm generate:module -- portal`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm openapi:check`

## Expected Output

- Append evidence to `.forge/evidence.md`, including the High-risk security
  self-check from `.forge/policy.md`.
- Update `.forge/trust.md`.
- Mark `F4-01A` done in `.forge/backlog.md`.
- Because this is a `Verify Gate: required`, set `.forge/state.md` to
  `Needs Verify` and write the independent VERIFY task to `.forge/next.md`.

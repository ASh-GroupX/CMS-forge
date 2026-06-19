# Verify Task: VERIFY-F4-02B - Verify Portal OTP Session Gate

Status: Needs Verify
Required model tier: BUILDER-STRONG or independent verifier
Risk: High
Phase: Phase 4 - Customer Portal
Verifies: F4-02B - Add OTP verification and expiring portal session issuance

## Review Scope

Verify the `F4-02B` build before any `F4-02C` tracking/detail reads build on it.

Check:
- `POST /portal/tracking/otp/verify` accepts only portal-safe verification inputs and request context.
- Reference number alone still cannot retrieve complaint status/details.
- Pending/unexpired OTP verification works and issues only a safe portal session token plus expiration.
- Wrong OTP, expired verification, exhausted attempts, non-pending rows, and unknown IDs fail closed with stable safe errors.
- Failed attempts increment and successful verification/session issuance do not expose OTP values, OTP hashes, session hashes, DMS customer codes, internal comments, audit logs, staff PII, unrelated complaints, or complaint details.
- Portal verification status/session writes and SECURITY audit entries happen in the same transaction.
- Module boundaries hold: portal writes portal-owned tables and reaches complaints only through the complaints public service.
- OpenAPI documents the public request and verify routes.
- Builder verification labels are honest and commands actually ran.

## Required Proof Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- portal.tracking`
- `corepack pnpm openapi:check`

## Output

- Builder honesty: Honest, Inflated, or Fabricated
- Code quality: Good, Acceptable, or Poor
- Recommendation: Accept, Repair, or Redo

On Accept, write `F4-02C - Add verified portal tracking endpoint` to `.forge/next.md` and set `.forge/state.md` to `Ready to Build` so AUTO PHASE can resume.
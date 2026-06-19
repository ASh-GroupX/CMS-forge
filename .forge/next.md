# Repair Task: REPAIR-F4-02B - Audit OTP Verification Failure Outcomes

Status: Needs Repair
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 4 - Customer Portal
Repairs: VERIFY-F4-02B - Portal OTP session gate

## Scope

Repair the `F4-02B` OTP verification/session gate before `F4-02C` tracking reads
build on it.

Keep the diff small and focused on the portal OTP verification path.

Required behavior:
- `POST /portal/tracking/otp/verify` still accepts only `verificationId`, `otp`,
  and server-derived request context.
- Reference number alone still cannot retrieve complaint status/details.
- Wrong OTP, expired verification, exhausted attempts, non-pending rows, and
  unknown IDs fail closed with stable safe errors.
- OTP success and every OTP verification failure path are SECURITY-audited without
  logging or returning OTP values, OTP hashes, session tokens, session hashes,
  DMS customer codes, internal comments, audit logs, staff PII, unrelated
  complaints, or complaint details.
- Failure paths that mutate portal verification status/attempts keep the mutation
  and SECURITY audit entry in the same transaction.
- Successful verification still marks the verification as verified, creates only a
  hashed portal session row, and audits inside the same transaction.
- Add focused `portal.tracking` tests for the previously unaudited failure paths
  and safe metadata.

## Required Proof Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- portal.tracking`
- `corepack pnpm test:api -- audit`
- `corepack pnpm openapi:check`

## Output

On pass, append build evidence/security self-check, update trust, keep `F4-02B`
as a verify gate by writing a `VERIFY-F4-02B-REPAIR` task to `.forge/next.md`,
and set `.forge/state.md` to `Needs Verify`.

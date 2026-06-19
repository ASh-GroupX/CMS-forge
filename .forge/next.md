# Build Task: F4-02A - Add Portal OTP Request Persistence And Notification Queueing

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 4 - Customer Portal
Verify Gate: not required
Depends on: VERIFY-F4-01C-REPAIR

## Why This Exists

Phase 4 now has a public complaint submission route. Tracking must not expose
complaint status or details based on reference number alone. This task adds the
first half of the verification flow: request an OTP for a complaint reference and
primary phone, persist only the OTP hash in `portal_verifications`, and queue a
customer notification through the notifications public service.

`F4-02B` will verify the OTP and issue the expiring portal session; do not build
that session/read behavior here.

## Requirement IDs

- REQ-PORTAL-002
- PORTAL-SEC-001
- REQ-NOTIFY-001
- ARCH-WORKFLOW-001
- METHOD-AUDIT-001
- METHOD-TEST-001
- API-STANDARD-001

## Scope

- Add a public portal OTP request boundary for complaint tracking using
  `referenceNumber`, `customerPhone`, and request context.
- Resolve the complaint/customer match through the complaints public service or an
  explicitly added public service method; do not import complaint repositories or
  Prisma models directly from the portal module.
- Persist a `portal_verifications` row with OTP hash, phone, complaint/customer IDs,
  expiry, attempt count, status, IP address, and created timestamp.
- Queue an internal notification through `NotificationsService` after the
  verification row is persisted.
- Add or extend `test:api -- portal.tracking` coverage for allowed request, unknown
  or mismatched reference/phone denial, rate-limit behavior, hash-only persistence,
  and no notification queue on denial.
- Add/extend `test:api -- notifications` coverage if the notification payload
  contract changes.
- Document the new public route in OpenAPI and keep `openapi:check` passing.

## Out Of Scope

- OTP verification.
- Portal session issuance or cookies.
- Tracking/detail/timeline reads.
- Portal follow-up comments or attachments.
- Web UI, E2E, visual, or accessibility work.
- Provider delivery, live SMS/WhatsApp/email adapters, Admin template management,
  or hardcoded production message templates.
- DMS customer code/customer number exposure.
- Schema or migration changes unless an existing model field is demonstrably
  insufficient for this task.

## Acceptance Criteria

- Reference number alone still cannot retrieve complaint status or details.
- The public OTP request accepts only portal-safe inputs and never accepts or
  returns DMS customer code/customer number, audit logs, internal comments, staff
  PII, tokens, or the OTP hash.
- OTP value is never logged, returned, or written in plaintext; persistence stores a
  hash only.
- OTP request failures use safe, stable errors and do not leak whether a reference
  or phone exists beyond the approved API shape.
- Notification queueing happens only after successful verification persistence.
- Rate limiting covers complaint reference, phone, and IP/session where available.
- Module boundaries hold: portal writes only portal-owned tables and calls other
  modules through public services.

## Required Proof Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- portal.tracking`
- `corepack pnpm test:api -- notifications`
- `corepack pnpm openapi:check`

## Security Self-Check Required

Because this is High risk, evidence must record the policy self-check:

- Roles and branch scope come from the server session, never client input.
- Each state change writes status history and an audit entry in the same
  transaction; side effects enqueue after commit.
- No passwords, OTPs, tokens, hashes, or provider secrets are logged or returned.
- Customer portal exposure rules hold: no internal comments, audit, DMS codes,
  staff PII, or unrelated complaints reach the portal.
- Trust boundaries are tested: at least one allowed and one denied case.

# Staging SMTP Arrival Proof

Use this runbook after a staging SMTP sender has been chosen and the sender DNS
records are configured. Do not commit `.env` files or paste real credentials into
Forge evidence.

## Required environment

Set these only in the staging shell, VPS `.env`, or a local uncommitted proof
session:

- `EMAIL_PROVIDER_DRIVER=smtp`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_FROM`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_SECURE=true` for implicit TLS ports, or `false` only when the provider
  documents STARTTLS on the configured port.
- `SMTP_PROOF_TO` with a safe mailbox that can be inspected for arrival.

## Sender checks

- Verify the sending domain has the provider's SPF record.
- Verify DKIM is enabled and passing for the sender.
- Verify DMARC is present for the sending domain, even if it is initially
  monitoring-only for pilot.
- Confirm the sender address in `SMTP_FROM` matches the authenticated provider
  account or an approved alias.

## Proof command

Run from the repository root:

```powershell
corepack pnpm smtp:proof
```

The command sends one message through the backend SMTP adapter path and prints
only non-secret metadata: proof id, provider, redacted recipient, recipient
domain, redacted accepted recipients, and whether a message id was returned.

## Evidence capture

Record the following in `.forge/evidence.md`:

- The proof id printed by `smtp:proof`.
- The redacted recipient/domain from command output.
- Whether `messageIdPresent` is `true`.
- A human confirmation that the message arrived in the mailbox and was not in
  spam.
- The timestamp and environment name.

Do not record SMTP credentials, raw provider logs, full recipient addresses,
headers containing private routing data, or screenshots that expose mailbox PII.

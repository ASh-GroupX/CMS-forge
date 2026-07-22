# Production Security Rotation And Smoke

Status: Production schema hotfix prepared; security closeout pending
Required model tier: GPT-5.5 Extra High or equivalent
Risk: Critical (production credentials and authenticated workflows)
SRS IDs: `NFR-SEC-002`, `NFR-AVAIL-001`, `NFR-DATA-001`,
`OPS-RUNBOOK-001`, `METHOD-TEST-001`

## Task

Rotate credentials exposed by the historical resolved-Compose Actions log,
then run authenticated English and Arabic production smoke for employee,
manager, and administrator roles. Retain the manual database and verified
cutover backup until rollback retention is approved.

The current production commit also carries migration 30, which restores the
missing board-stage table and task board columns before authenticated smoke.

## Required Gates

- Needs Human Review: rotate PostgreSQL, Redis, SMTP, and object-storage
  credentials without printing values in Actions or operator evidence.
- Needs Human Review: smoke login, dashboard, complaints, tasks, reports, and
  attachments for representative production roles and both locales.
- Needs Human Review: confirm an off-VPS encrypted database backup and decide
  when to retire the stopped manual stack.

## Proof

- Passed: authoritative row counts matched before and after database restore.
- Passed: the existing managed database has all 29 prior migrations applied.
- Passed: migration 30 applies cleanly from an empty isolated PostgreSQL schema,
  creates 13 default board stages, and exposes both required task columns.
- Passed: Actions run `29728937945`, attempt 2, deployed production commit
  `45865725` successfully.
- Passed: public HTTP 200, API health `ok`, exact commit response header, and
  external port 8080 rejection.

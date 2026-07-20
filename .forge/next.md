# Production Security Rotation And Smoke

Status: Automated production deployment operational; security closeout pending
Required model tier: GPT-5.5 Extra High or equivalent
Risk: Critical (production credentials and authenticated workflows)
SRS IDs: `NFR-SEC-002`, `NFR-AVAIL-001`, `NFR-DATA-001`,
`OPS-RUNBOOK-001`, `METHOD-TEST-001`

## Task

Rotate credentials exposed by the historical resolved-Compose Actions log,
then run authenticated English and Arabic production smoke for employee,
manager, and administrator roles. Retain the manual database and verified
cutover backup until rollback retention is approved.

## Required Gates

- Needs Human Review: rotate PostgreSQL, Redis, SMTP, and object-storage
  credentials without printing values in Actions or operator evidence.
- Needs Human Review: smoke login, dashboard, complaints, tasks, reports, and
  attachments for representative production roles and both locales.
- Needs Human Review: confirm an off-VPS encrypted database backup and decide
  when to retire the stopped manual stack.

## Proof

- Passed: authoritative row counts matched before and after database restore.
- Passed: all 29 Prisma migrations are applied to the managed database.
- Passed: Actions run `29728937945`, attempt 2, deployed production commit
  `45865725` successfully.
- Passed: public HTTP 200, API health `ok`, exact commit response header, and
  external port 8080 rejection.

# Current State

Status: Deployment guard complete; production data cutover pending
Phase: Production deployment hardening
Next Task: Migrate authoritative data, correct the VPS hostname, then switch Nginx
Model Tier: GPT-5.5 Extra High or equivalent

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in `.forge/archive/state-archive.md`.

## Snapshot

- GitHub Actions deploys `production` to `/root/cms-auto` as the
  `cms-auto-prod` Compose project.
- The VPS environment names `cms-auto.laith-alobaidi-crm.com`, which has no DNS
  record and differs from the user-facing `cms.laith-alobaidi-crm.com` host.
- The GitHub-managed gateway and API are healthy when addressed with their
  configured Host header, but the public domain is still served by host Nginx
  from the manual `/opt/cms-auto` stack on ports 4100 and 3100.
- Actions created a separate `cms-auto-prod_postgres-data` volume on 2026-07-13;
  the deploy workflow runs migrations but never seeds or imports the manual
  production database.
- The deployment guard now enforces the canonical hostname, binds port 8080 to
  loopback, suppresses resolved Compose output, removes global image pruning,
  and fails unless the public domain returns the managed Caddy marker.

## Current Stop

Do not switch Nginx yet. Verify and migrate the authoritative manual database
into the managed production database first, with tested backups and rollback.

## Security Carry-Forward

Rotate database, Redis, SMTP, and object-storage credentials that appeared in
the historical Actions log. Do not include replacement values in GitHub logs or
Forge evidence.

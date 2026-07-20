# Current State

Status: GitHub-managed production deployment active and externally verified
Phase: Production deployment hardening
Next Task: Rotate exposed credentials and complete authenticated multi-role smoke
Model Tier: GPT-5.5 Extra High or equivalent

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in `.forge/archive/state-archive.md`.

## Snapshot

- Host Nginx routes `cms.laith-alobaidi-crm.com` to the GitHub-managed Caddy
  gateway on `127.0.0.1:8080`.
- The authoritative manual database was backed up and restored into
  `cms-auto-prod_postgres-data`; selected row counts matched exactly before and
  after restore, and migration 29 applied successfully.
- Production commit `45865725` deployed through Actions run `29728937945`,
  attempt 2. Public HTTPS returns that exact SHA in `X-CMS-Deployment` and API
  health is `ok`.
- API, web, worker, Caddy, PostgreSQL, and Redis passed the workflow health gate.
- Port 8080 is loopback-only and is not reachable externally.
- The first deployment attempt hit a transient 15-second SSH reachability
  timeout; the workflow now allows a bounded 60-second retry window.
- Manual API and web containers remain stopped. Their PostgreSQL and Redis
  containers and the cutover backup remain available for rollback.

## Current Stop

Functional deployment cutover is complete. Security closeout still requires
credential rotation, authenticated multi-role smoke, and off-VPS backup proof.

# Current State

Status: Production schema hotfix prepared and fully verified locally
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
- Public HTTPS currently serves production revision `97412ba0`; API health is
  `ok`, but authenticated task reads return `INTERNAL_ERROR` because the
  board-stage schema change had no deployable migration.
- Migration `20260722120000_board_stages` adds the missing `board_stages` table,
  `tasks.stage_id`, and `tasks.board_position`, including 13 production defaults.
- All 30 migrations applied successfully in an isolated PostgreSQL schema. The
  production workflow will create its required pre-migration backup before
  applying migration 30.
- API, web, worker, Caddy, PostgreSQL, and Redis passed the workflow health gate.
- Port 8080 is loopback-only and is not reachable externally.
- The first deployment attempt hit a transient 15-second SSH reachability
  timeout; the workflow now allows a bounded 60-second retry window.
- Manual API and web containers remain stopped. Their PostgreSQL and Redis
  containers and the cutover backup remain available for rollback.

## Current Stop

Deploy and verify the schema hotfix, then continue security closeout: credential
rotation, authenticated multi-role smoke, and off-VPS backup proof.

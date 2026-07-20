# Production Data And Route Cutover

Status: Deployment guards ready; production cutover blocked on data verification
Required model tier: GPT-5.5 Extra High or equivalent
Risk: Critical (production data, credentials, and public routing)
SRS IDs: `NFR-SEC-002`, `NFR-AVAIL-001`, `NFR-DATA-001`,
`OPS-RUNBOOK-001`

## Task

Confirm the authoritative `/opt/cms-auto` database, back it up, and migrate it
into the GitHub-managed `cms-auto-prod` database before changing public traffic.
Set the VPS `SITE_DOMAIN` to `cms.laith-alobaidi-crm.com`, update host Nginx to
route that domain to loopback port 8080, and retain the manual stack as the
tested rollback target until authenticated production smoke passes.

## Required Gates

- Needs Human Review: compare non-secret row counts and latest complaint dates
  in `cms-auto-postgres-1` and `cms-auto-prod-postgres-1`.
- Needs Human Review: create and verify backups of both databases before restore
  or routing changes.
- Needs Human Review: migrate the authoritative data, run Prisma migrations,
  and smoke employee, manager, and administrator access in English and Arabic.
- Needs Human Review: rotate every credential present in the historical
  resolved-Compose Actions log.

## Proof

- Passed: `node --test tools/prod-deploy-artifacts.test.mjs` (4/4).
- Passed: `corepack pnpm lint` and `git diff --check`.
- Passed: read-only live probes distinguish the public Nginx route from the
  GitHub-managed Caddy route and verify the latter's API health.

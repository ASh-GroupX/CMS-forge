# Production Deployment Route Verification

Status: Implementation and local proof complete; VPS routing pending
Required model tier: GPT-5.5 Extra High or equivalent
Risk: Critical (false-positive deployment and production secret exposure)
SRS IDs: `NFR-SEC-002`, `NFR-AVAIL-001`, `OPS-RUNBOOK-001`

## Task

Make production deployment fail closed when the public domain does not route to
the GitHub-managed Compose stack. Keep resolved environment values out of Actions
logs and avoid global Docker cleanup on the shared VPS.

## Proof

- Passed: `node --test tools/prod-deploy-artifacts.test.mjs` (4/4).
- Passed: `corepack pnpm lint` and `git diff --check`.
- Needs Human Review: point the domain's host Nginx upstream to
  `127.0.0.1:8080`, rotate credentials exposed by historical logs, merge to
  `production`, and verify the next Actions run.

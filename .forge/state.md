# Current State

Status: Business readiness Slice 4 complete
Phase: business-readiness-remediation
Next Task: Slice 5 - Admin Category and SLA UI
Model Tier: GPT-5.5 Extra High

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Branch `codex/user-scoped-ux-redesign` is active.
- Slice 0 still lacks human signoff for report deferrals, DMS mode, compensation scope, and approved notification channels.
- Slice 1 queues customer OTP delivery through the existing notification queue as SMS, with English/Arabic body text selected by portal locale.
- Slice 2 queues submit notifications and creates intake SLA deadline events after submitted complaint creation commits; drafts still create no active SLA deadline or submit notification.
- Slice 3 enforces backend management-readonly masking for complaint search/detail sensitive values using the server-derived role.
- Slice 4 wires the audit viewer to backend search/export through the staff session cookie, with filters, localized states, and backend-redacted metadata.
- Audit append-only enforcement remains in the database proof; `test:api -- audit` skips that Docker-backed proof only when Docker is unavailable.
- Proof passed for Slice 4: `test:api -- audit`, `test:web -- api-client`, `test:web -- shell`, `test:web -- localization`, `test:e2e -- accessibility`, `test:visual`, `openapi:check`, `typecheck`, `lint`, and `git diff --check`.

## Current Stop

Ready to commit Slice 4, then start Slice 5.

## Open Carry-Forward / Known Debt

- Human signoff is still needed before slices that depend on report deferrals, DMS live/manual mode, compensation scope, or notification-channel approval.
- Docker append-only proof for Slice 4 was skipped on this machine because Docker is unavailable; run `corepack pnpm test:api -- audit` with Docker running to exercise it.
- Existing unrelated dirty `apps/api/src/modules/integrations/integrations.module.ts` and untracked proof artifacts remain untouched.

# Current State

Status: Business readiness Slice 2 complete
Phase: business-readiness-remediation
Next Task: Slice 3 - Management-Readonly Masking
Model Tier: GPT-5.5 Extra High

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Branch `codex/user-scoped-ux-redesign` is active.
- Slice 0 still lacks human signoff for report deferrals, DMS mode, compensation scope, and approved notification channels. Slice 1 could proceed using the SRS default OTP method: code to complaint primary phone.
- Slice 1 queues customer OTP delivery through the existing notification queue as SMS, with English/Arabic body text selected by portal locale.
- Slice 2 now queues submit notifications and creates intake SLA deadline events after submitted complaint creation commits.
- Draft complaints still do not create active SLA deadlines or submit notifications.
- Complaint creation still writes complaint, initial status history, case wrapper, and audit inside the same transaction before side effects run.
- Proof passed for Slice 2: `test:api -- workflow`, `test:api -- portal`, `test:api -- sla`, `openapi:check`, `typecheck`, and `lint`.

## Current Stop

Ready to commit Slice 2, then start Slice 3.

## Open Carry-Forward / Known Debt

- Human signoff is still needed before slices that depend on report deferrals, DMS live/manual mode, compensation scope, or notification-channel approval.
- Live browser screenshots for wrong-code, expired, and exhausted OTP states were not run in Slice 1; registered visual proof renders route previews and the customer portal e2e proof covers those states without a browser.
- Existing unrelated dirty `apps/api/src/modules/integrations/integrations.module.ts` and untracked proof artifacts remain untouched.
